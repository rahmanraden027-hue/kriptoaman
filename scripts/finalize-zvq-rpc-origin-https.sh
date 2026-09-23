#!/usr/bin/env bash
set -Eeuo pipefail
IP=206.189.36.15
NAME=zvq-rpc-origin-tls
BASE=/var/lib/zvq-rpc-origin-tls
CERT=/etc/letsencrypt/live/zvq-rpc-origin/fullchain.pem
KEY=/etc/letsencrypt/live/zvq-rpc-origin/privkey.pem
RUN_ID="${ZVQ_RPC_TLS_RUN_ID:-}"
[[ "$RUN_ID" =~ ^[0-9]{7,16}$ ]] || exit 1
test "$(id -u)" -eq 0
if ss -H -ltn '( sport = :443 )' | grep -q .; then
  if docker inspect "$NAME" >/dev/null 2>&1; then
    chain="$(curl --noproxy '*' --fail-with-body -sS --max-time 10 -H 'content-type: application/json' --data '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}' "https://$IP/" | jq -er '.result')"
    test "$chain" = 0x560c
    echo "rpc_origin_tls=already_verified; chain_id=$chain; chain_state_unchanged=yes"
    exit 0
  fi
  echo 'port_443_owned_by_unreviewed_service' >&2; exit 1
fi
UPSTREAM=
for p in 8545 8546 8547 9545; do
  if ss -H -ltn "( sport = :$p )" | grep -q .; then
    result="$(curl -sS --max-time 3 -H 'content-type: application/json' --data '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}' "http://127.0.0.1:$p" | jq -r '.result // empty' || true)"
    if [[ "$result" = 0x560c ]]; then UPSTREAM=$p; break; fi
  fi
done
test -n "$UPSTREAM"
# Only expose the production listener after independent Internet HTTP-01 proof.
test "${ZVQ_RPC_ACME_PROOF:-}" = verified_external || { echo 'rpc_tls_blocked=missing_external_acme_preflight' >&2; exit 1; }
# Do not interrupt any existing HTTP service to obtain the six-day IP certificate.
if [[ ! -r "$CERT" || ! -r "$KEY" ]] || ! openssl x509 -in "$CERT" -noout -checkend 172800 >/dev/null 2>&1; then
  if ss -H -ltn '( sport = :80 )' | grep -q .; then
    echo 'safe_abort=port_80_in_use; no HTTP service or RPC process was changed' >&2
    exit 1
  fi
fi
install -d -m 0700 "$BASE" /etc/letsencrypt /var/lib/letsencrypt /var/log/letsencrypt
if [[ ! -r "$CERT" || ! -r "$KEY" ]] || ! openssl x509 -in "$CERT" -noout -checkend 172800 >/dev/null 2>&1; then
  # Port 80 is used only for the ACME challenge; this does not touch the RPC process.
  docker run --rm --network host -v /etc/letsencrypt:/etc/letsencrypt:rw -v /var/lib/letsencrypt:/var/lib/letsencrypt:rw -v /var/log/letsencrypt:/var/log/letsencrypt:rw certbot/certbot:v5.7.0 certonly --non-interactive --agree-tos --register-unsafely-without-email --preferred-profile shortlived --standalone --http-01-port 80 --ip-address "$IP" --cert-name zvq-rpc-origin --keep-until-expiring
fi
openssl x509 -in "$CERT" -noout -ext subjectAltName | grep -Fq "IP Address:$IP"
openssl x509 -in "$CERT" -noout -checkend 172800 >/dev/null
# The gateway rejects every RPC method not explicitly enumerated in the allowlist.
# Do not attempt to inspect raw request bodies in NGINX rewrite phase.
install -m 0644 /tmp/zvq-rpc-allowlist-gateway.mjs "$BASE/gateway.mjs"
CONF="$BASE/default.conf"
cat >"$CONF" <<NGINX
server {
 listen 443 ssl default_server;
 server_name $IP;
 ssl_certificate /etc/letsencrypt/live/zvq-rpc-origin/fullchain.pem;
 ssl_certificate_key /etc/letsencrypt/live/zvq-rpc-origin/privkey.pem;
 ssl_protocols TLSv1.2 TLSv1.3;
 server_tokens off;
 client_max_body_size 32k;
 location = / {
   # Let the strict loopback gateway handle OPTIONS/CORS, POST method and JSON-RPC allowlist.
   proxy_pass http://127.0.0.1:18445;
   proxy_set_header Host 127.0.0.1;
   proxy_connect_timeout 3s;
   proxy_read_timeout 12s;
 }
 location / { return 404; }
}
NGINX
docker run --rm --network none --mount "type=bind,src=$CONF,dst=/etc/nginx/conf.d/default.conf,readonly" --mount "type=bind,src=/etc/letsencrypt,dst=/etc/letsencrypt,readonly" nginx:stable-alpine nginx -t
# Bind the policy gateway to loopback before opening HTTPS to the Internet.
if ss -H -ltn '( sport = :18445 )' | grep -q .; then
  echo 'safe_abort=gateway_port_already_owned' >&2; exit 1
fi
GATE_NAME=zvq-rpc-allowlist-gateway
PENDING="$BASE/pending-$RUN_ID"
test ! -e "$PENDING"
umask 077
printf 'run_id=%s\nufw_rule_added=no\n' "$RUN_ID" > "$PENDING"
rollback_stage() {
  docker rm -f "$NAME" "$GATE_NAME" >/dev/null 2>&1 || true
  if grep -Fxq 'ufw_rule_added=yes' "$PENDING"; then
    ufw --force delete allow 443/tcp >/dev/null 2>&1 || true
  fi
  rm -f "$PENDING"
}
trap 'rollback_stage' ERR
docker run -d --name "$GATE_NAME" --network host --restart unless-stopped --read-only --user 10001:10001 --cap-drop ALL --security-opt no-new-privileges --memory 128m --pids-limit 64 --tmpfs /tmp --mount "type=bind,src=$BASE/gateway.mjs,dst=/gateway.mjs,readonly" -e "ZVQ_UPSTREAM_PORT=$UPSTREAM" -e ZVQ_GATEWAY_PORT=18445 node:24-alpine node /gateway.mjs >/dev/null
for attempt in 1 2 3 4 5; do
  if curl --noproxy '*' --silent --show-error --max-time 3 -H 'content-type: application/json' --data '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}' http://127.0.0.1:18445/ | jq -e '.result == "0x560c"' >/dev/null 2>&1; then break; fi
  sleep 1
done
curl --noproxy '*' --fail-with-body -sS --max-time 5 -H 'content-type: application/json' --data '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}' http://127.0.0.1:18445/ | jq -e '.result == "0x560c"' >/dev/null
docker run -d --name "$NAME" --network host --restart unless-stopped --read-only --cap-drop ALL --cap-add CHOWN --cap-add NET_BIND_SERVICE --cap-add SETUID --cap-add SETGID --security-opt no-new-privileges --tmpfs /var/cache/nginx --tmpfs /var/run --tmpfs /tmp --mount "type=bind,src=$CONF,dst=/etc/nginx/conf.d/default.conf,readonly" --mount "type=bind,src=/etc/letsencrypt,dst=/etc/letsencrypt,readonly" nginx:stable-alpine >/dev/null
docker exec "$NAME" nginx -t
if command -v ufw >/dev/null && ufw status | grep -q '^Status: active'; then
  if ! ufw status | grep -Eq '^443/tcp[[:space:]]+ALLOW'; then
    ufw allow 443/tcp comment 'ZVQ audited RPC origin HTTPS' >/dev/null
    sed -i 's/ufw_rule_added=no/ufw_rule_added=yes/' "$PENDING"
  fi
fi
chain="$(curl --noproxy '*' --fail-with-body -sS --max-time 10 -H 'content-type: application/json' --data '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}' "https://$IP/" | jq -er '.result')"
test "$chain" = 0x560c
blocked="$(curl --noproxy '*' -sS --max-time 5 -o /dev/null -w '%{http_code}' -H 'content-type: application/json' --data '{"jsonrpc":"2.0","id":2,"method":"admin_peers","params":[]}' "https://$IP/")"
test "$blocked" = 403
write_denied="$(curl --noproxy '*' -sS --max-time 5 -o /dev/null -w '%{http_code}' -H 'content-type: application/json' --data '{"jsonrpc":"2.0","id":3,"method":"eth_sendRawTransaction","params":["0x01"]}' "https://$IP/")"
test "$write_denied" = 403
trap - ERR
echo "rpc_origin_tls=staged_pending_external_proof; run_id=$RUN_ID; chain_id=$chain; upstream_loopback_port=$UPSTREAM; chain_state_unchanged=yes"
