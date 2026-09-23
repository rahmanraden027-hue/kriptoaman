#!/usr/bin/env bash
# Isolated read-only IP HTTPS fallback: no changes to existing port 80, DNS or chain.
set -Eeuo pipefail
IP=146.190.93.254
BASE=/var/lib/zvq-origin-ip-tls
CERT=/etc/letsencrypt/live/zvq-origin-ip/fullchain.pem
KEY=/etc/letsencrypt/live/zvq-origin-ip/privkey.pem
NAME=zvq-origin-ip-tls
IMAGE=nginx:stable-alpine
RUN_ID="$ZVQ_TLS_RUN_ID"
[[ "$RUN_ID" =~ ^[0-9]{7,16}$ ]] || { echo 'Authorized CI run ID required' >&2; exit 1; }
test "$(id -u)" -eq 0
test -r "$CERT" && test -r "$KEY"
openssl x509 -in "$CERT" -noout -checkend 172800 >/dev/null
openssl x509 -in "$CERT" -noout -ext subjectAltName | grep -Fq "IP Address:$IP"
grep -Fq 'data-zvq-token-discovery="indexed-v2"' /opt/blockscout/docker-compose/proxy/kam-dashboard/index.html
test "$(curl --noproxy '*' -fsS --max-time 10 -o /dev/null -w '%{http_code}' http://127.0.0.1/)" = 200
test -z "$(ss -H -ltn '( sport = :443 )')"
if docker inspect "$NAME" >/dev/null 2>&1; then echo 'Existing TLS container requires audited update' >&2; exit 1; fi
umask 077
install -d -m 0700 "$BASE"
CONFIG="$BASE/default.conf"
PENDING="$BASE/pending-$RUN_ID"
test ! -e "$PENDING"
cat >"$CONFIG" <<'NGINX'
server {
  listen 443 ssl default_server;
  server_name 146.190.93.254;
  ssl_certificate /etc/letsencrypt/live/zvq-origin-ip/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/zvq-origin-ip/privkey.pem;
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_session_tickets off;
  server_tokens off;
  client_max_body_size 1024;
  add_header Cache-Control "no-store" always;
  add_header X-ZVQ-Origin "standalone-ip-readonly" always;
  proxy_hide_header Set-Cookie;
  proxy_set_header Host explorer.kriptoaman.com;
  proxy_set_header X-Forwarded-Proto https;
  proxy_set_header X-Forwarded-For $remote_addr;
  proxy_connect_timeout 3s;
  proxy_read_timeout 12s;
  # Explicit read-only routes. No raw RPC or administrative interface.
  location = / { limit_except GET { deny all; } proxy_pass http://127.0.0.1:80; }
  location ^~ /zevaryq-assets/ { limit_except GET { deny all; } proxy_pass http://127.0.0.1:80; }
  location ^~ /api/v2/ { limit_except GET { deny all; } proxy_pass http://127.0.0.1:80; }
  location ~ ^/(blocks|txs|tokens|addresses|validators|status|stats|contracts|api-docs)$ {
    limit_except GET { deny all; }
    proxy_pass http://127.0.0.1:80;
  }
  location = /healthz { return 200 "healthy"; }
  location = /rpc { return 403; }
  location ^~ /api/ { return 403; }
  location / { return 404; }
}
NGINX
chmod 0600 "$CONFIG"
docker run --rm --network none \
 --mount "type=bind,src=$CONFIG,dst=/etc/nginx/conf.d/default.conf,readonly" \
 --mount "type=bind,src=/etc/letsencrypt,dst=/etc/letsencrypt,readonly" \
 "$IMAGE" nginx -t
echo 'nginx_candidate=syntax_valid'
printf 'created_by=%s\nufw_rule_added=no\n' "$RUN_ID" >"$PENDING"
rollback() {
  code=$?
  if [[ -e "$PENDING" ]]; then
    docker rm -f "$NAME" >/dev/null 2>&1 || true
    if grep -Fxq 'ufw_rule_added=yes' "$PENDING"; then ufw --force delete allow 443/tcp >/dev/null || true; fi
    rm -f "$PENDING"
  fi
  echo "standalone_tls_stage=rolled_back; exit=$code" >&2
  exit "$code"
}
trap rollback ERR
docker run -d --name "$NAME" --network host --restart unless-stopped \
 --read-only --cap-drop ALL --cap-add NET_BIND_SERVICE --cap-add SETUID --cap-add SETGID \
 --security-opt no-new-privileges \
 --tmpfs /var/cache/nginx --tmpfs /var/run --tmpfs /tmp \
 --mount "type=bind,src=$CONFIG,dst=/etc/nginx/conf.d/default.conf,readonly" \
 --mount "type=bind,src=/etc/letsencrypt,dst=/etc/letsencrypt,readonly" \
 "$IMAGE" >/dev/null
docker exec "$NAME" nginx -t
body="$(mktemp)"
status="$(curl --noproxy '*' -fsS --connect-timeout 5 --max-time 12 -o "$body" -w '%{http_code}' "https://$IP/")"
test "$status" = 200
grep -Fq 'data-zvq-reference-visual="blue-gold-orbital-20260924"' "$body"
grep -Fq 'data-zvq-token-discovery="indexed-v2"' "$body"
rm -f "$body"
test "$(curl --noproxy '*' -sS --max-time 8 -o /dev/null -w '%{http_code}' "https://$IP/rpc")" = 403
test "$(curl --noproxy '*' -sS --max-time 8 -o /dev/null -w '%{http_code}' "https://$IP/api/admin")" = 403
if ! ufw status | grep -Eq '^443/tcp[[:space:]]+ALLOW'; then
  ufw allow 443/tcp comment 'ZVQ audited standalone IP HTTPS' >/dev/null
  sed -i 's/ufw_rule_added=no/ufw_rule_added=yes/' "$PENDING"
fi
trap - ERR
echo 'standalone_ip_tls=local_verified; port_80_unchanged=yes; firewall_443=staged; pending_external_proof=yes'
