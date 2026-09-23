#!/usr/bin/env bash
# Publish a separate, browser-trusted IP HTTPS fallback. Do not replace HTTP
# Explorer, RPC sentry, Cloudflare DNS/Worker, chain, DB, or validator services.
set -Eeuo pipefail
IP='146.190.93.254'
RPC_IP='206.189.36.15'
CERT='/etc/letsencrypt/live/zvq-origin-ip/fullchain.pem'
KEY='/etc/letsencrypt/live/zvq-origin-ip/privkey.pem'
ROOT='/opt/blockscout/docker-compose/proxy/kam-dashboard'
TEMPLATE='/opt/blockscout/docker-compose/proxy/default.conf.template'
BASE='/opt/zvq-origin-https'
IMAGE='nginx:stable-alpine'
NAME='zevaryq-direct-https'
STARTED=false

fail() {
  echo "ZVQ direct origin: $*" >&2
  if [[ "$STARTED" == true ]]; then docker rm -f "$NAME" >/dev/null 2>&1 || true; fi
  exit 1
}
rollback() {
  rc=$?
  trap - ERR
  if [[ "$STARTED" == true ]]; then docker rm -f "$NAME" >/dev/null 2>&1 || true; fi
  echo "zvq_direct_https=rolled_back; reason=failed_proof" >&2
  exit "$rc"
}
trap rollback ERR
test "$(id -u)" -eq 0 || fail 'Root privileges required'
test -r "$CERT" && test -r "$KEY" || fail 'Existing trusted IP certificate from PR #736 is missing'
openssl x509 -in "$CERT" -noout -ext subjectAltName | grep -Fq "IP Address:$IP" || fail 'Certificate IP SAN mismatch'
openssl x509 -in "$CERT" -noout -checkend 172800 || fail 'Certificate expires within two days'
grep -Fq 'ZVQ_ACME_WEBROOT_V1' "$TEMPLATE" || fail 'Verified HTTP-01 renewal path is missing'
grep -Fq 'data-zvq-token-discovery="indexed-v2"' "$ROOT/index.html" || fail 'Current Explorer origin UI not found'
if docker ps --format '{{.Names}}' | grep -Fxq "$NAME"; then
  echo 'zvq_direct_https=already_running; no destructive redeploy attempted'
  exit 0
fi
if ss -H -ltn '( sport = :443 )' | grep -q .; then
  fail 'Existing listener owns TCP 443; do not replace it'
fi
chain="$(curl --noproxy '*' -fsS --connect-timeout 5 --max-time 15 \
  --resolve "rpc.kriptoaman.com:443:$RPC_IP" \
  -H 'content-type: application/json' \
  --data '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}' \
  'https://rpc.kriptoaman.com/' |
  python3 -c 'import json,sys; print(json.load(sys.stdin).get("result",""))')" ||
  fail 'Independent RPC sentry direct TLS preflight failed'
test "$chain" = '0x560c' || fail 'Independent RPC chain ID mismatch'
local_blocks="$(curl --noproxy '*' -fsS --connect-timeout 5 --max-time 15 \
  'http://127.0.0.1/api/v2/blocks' |
  python3 -c 'import json,sys; b=json.load(sys.stdin); print(len(b["items"]) if isinstance(b.get("items"),list) else 0)')" ||
  fail 'Local Blockscout indexer preflight failed'
test "$local_blocks" -gt 0 || fail 'Local Blockscout has no independently indexed blocks'
docker pull "$IMAGE" >/dev/null
install -d -m 0750 "$BASE"
cat > "$BASE/nginx.conf" <<'NGINX'
worker_processes auto;
pid /var/run/nginx.pid;
events { worker_connections 512; }
http {
  include /etc/nginx/mime.types;
  server_tokens off;
  server {
    listen 443 ssl default_server;
    server_name _;
    ssl_certificate /etc/letsencrypt/live/zvq-origin-ip/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/zvq-origin-ip/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    client_max_body_size 512k;
    add_header X-ZVQ-Independent-Origin "trusted-ip-v1" always;
    location = /rpc {
      limit_except POST { deny all; }
      proxy_pass https://206.189.36.15/;
      proxy_ssl_server_name on;
      proxy_ssl_name rpc.kriptoaman.com;
      proxy_ssl_verify on;
      proxy_ssl_verify_depth 5;
      proxy_ssl_trusted_certificate /etc/ssl/certs/ca-certificates.crt;
      proxy_set_header Host rpc.kriptoaman.com;
      proxy_set_header Content-Type application/json;
      proxy_connect_timeout 7s;
      proxy_read_timeout 25s;
      proxy_send_timeout 15s;
    }
    location / {
      proxy_pass http://127.0.0.1:80;
      proxy_http_version 1.1;
      proxy_set_header Host explorer.kriptoaman.com;
      proxy_set_header X-Forwarded-Proto https;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_connect_timeout 6s;
      proxy_read_timeout 30s;
    }
  }
}
NGINX
chmod 0640 "$BASE/nginx.conf"
# Host network is intentional: only the new TCP443 listener; preexisting
# HTTP:80 and Blockscout containers are not restarted or modified.
docker run --rm --network host --read-only \
  --tmpfs /var/cache/nginx:rw,mode=1777 --tmpfs /var/run:rw,mode=0755 \
  -v "$BASE/nginx.conf:/etc/nginx/nginx.conf:ro" \
  -v /etc/letsencrypt:/etc/letsencrypt:ro \
  -v /etc/ssl/certs/ca-certificates.crt:/etc/ssl/certs/ca-certificates.crt:ro \
  "$IMAGE" nginx -t
docker run -d --name "$NAME" --restart unless-stopped --network host \
  --read-only --security-opt no-new-privileges:true \
  --cap-drop ALL --cap-add NET_BIND_SERVICE \
  --tmpfs /var/cache/nginx:rw,mode=1777 --tmpfs /var/run:rw,mode=0755 \
  -v "$BASE/nginx.conf:/etc/nginx/nginx.conf:ro" \
  -v /etc/letsencrypt:/etc/letsencrypt:ro \
  -v /etc/ssl/certs/ca-certificates.crt:/etc/ssl/certs/ca-certificates.crt:ro \
  "$IMAGE" >/dev/null
STARTED=true
sleep 2
html="$(curl --noproxy '*' --resolve "$IP:443:127.0.0.1" \
  -fsS --connect-timeout 6 --max-time 20 "https://$IP/")" ||
  fail 'Trusted localhost IP HTTPS homepage unavailable'
grep -Fq 'data-zvq-reference-visual="blue-gold-orbital-20260924"' <<<"$html" ||
  fail 'Approved orbital UI is missing from independent HTTPS'
grep -Fq 'data-zvq-token-discovery="indexed-v2"' <<<"$html" ||
  fail 'Verified token discovery is missing from independent HTTPS'
rpc="$(curl --noproxy '*' --resolve "$IP:443:127.0.0.1" \
  -fsS --connect-timeout 6 --max-time 20 -H 'content-type: application/json' \
  --data '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}' \
  "https://$IP/rpc" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("result",""))')" ||
  fail 'Independent IP TLS same-origin RPC unavailable'
test "$rpc" = '0x560c' || fail 'Independent IP TLS RPC has wrong chain ID'
blocks="$(curl --noproxy '*' --resolve "$IP:443:127.0.0.1" \
  -fsS --connect-timeout 6 --max-time 20 "https://$IP/api/v2/blocks" |
  python3 -c 'import json,sys; j=json.load(sys.stdin); print(len(j["items"]) if isinstance(j.get("items"),list) else 0)')" ||
  fail 'Independent IP TLS indexed blocks unavailable'
test "$blocks" -gt 0 || fail 'Independent IP TLS indexer returned empty blocks'
# Only after local browser-trusted TLS, RPC and Blockscout prove healthy
# do we permit external access to TCP443. No changes to UFW rules for port80.
if command -v ufw >/dev/null 2>&1 && ufw status | grep -qi '^Status: active'; then
  if ! ufw status | grep -Eq '^443/tcp[[:space:]]+ALLOW'; then
    ufw allow 443/tcp
    echo 'origin_ufw_443=newly_allowed'
  else echo 'origin_ufw_443=already_allowed'; fi
fi
echo "zvq_direct_https=verified_local ip_san=verified chain=$rpc indexed_blocks=$blocks tcp443=enabled"
trap - ERR
STARTED=false
