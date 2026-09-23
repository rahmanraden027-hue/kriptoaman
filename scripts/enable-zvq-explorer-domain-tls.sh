#!/usr/bin/env bash
# Add SNI-only Explorer domain certificate to the existing independent IP listener.
set -Eeuo pipefail
BASE=/var/lib/zvq-origin-ip-tls
CONFIG="$BASE/default.conf"
NAME=zvq-origin-ip-tls
DOMAIN=explorer.kriptoaman.com
IP=146.190.93.254
RUN_ID="$ZVQ_DOMAIN_RUN_ID"
[[ "$RUN_ID" =~ ^[0-9]{7,16}$ ]] && test "$(id -u)" -eq 0
test "$(docker inspect -f '{{.State.Status}}' "$NAME")" = running
test -r "$CONFIG"
CERT=/etc/letsencrypt/live/zvq-explorer-domain/fullchain.pem
KEY=/etc/letsencrypt/live/zvq-explorer-domain/privkey.pem
test -r "$CERT" && test -r "$KEY"
openssl x509 -in "$CERT" -noout -checkend 172800 >/dev/null
openssl x509 -in "$CERT" -noout -ext subjectAltName | grep -Fq "DNS:$DOMAIN"
BACKUP="$CONFIG.domain-$RUN_ID.bak"
NEXT="$BASE/candidate-domain-$RUN_ID.conf"
test ! -e "$BACKUP"
test ! -e "$NEXT"
python3 - "$CONFIG" "$NEXT" <<'PY'
from pathlib import Path
import sys
src=Path(sys.argv[1]).read_text()
assert src.count("server {")==1, "Expected only the existing IP listener"
assert 'listen 443 ssl default_server;' in src
assert 'server_name 146.190.93.254;' in src
assert 'location = /rpc { return 403; }' in src
assert 'location ^~ /api/ { return 403; }' in src
assert 'ssl_certificate /etc/letsencrypt/live/zvq-origin-ip/fullchain.pem;' in src
assert 'ssl_certificate_key /etc/letsencrypt/live/zvq-origin-ip/privkey.pem;' in src
assert 'ZVQ_DOMAIN_TLS_V1' not in src
second=src.replace('listen 443 ssl default_server;', 'listen 443 ssl;', 1)
second=second.replace('server_name 146.190.93.254;', 'server_name explorer.kriptoaman.com;',1)
second=second.replace('/etc/letsencrypt/live/zvq-origin-ip/', '/etc/letsencrypt/live/zvq-explorer-domain/')
second=second.replace('standalone-ip-readonly','standalone-domain-readonly')
assert second!=src and second.count('server {')==1
Path(sys.argv[2]).write_text(src+'\n# ZVQ_DOMAIN_TLS_V1\n'+second)
PY
chmod 0600 "$NEXT"
docker run --rm --network none \
 --mount "type=bind,src=$NEXT,dst=/etc/nginx/conf.d/default.conf,readonly" \
 --mount 'type=bind,src=/etc/letsencrypt,dst=/etc/letsencrypt,readonly' \
 nginx:stable-alpine nginx -t
cp -a "$CONFIG" "$BACKUP"
CHANGED=false
rollback() {
 code=$?
 trap - ERR
 if [[ "$CHANGED" == true ]]; then
   cat "$BACKUP" > "$CONFIG" || true
   docker exec "$NAME" nginx -s reload || true
 fi
 echo "domain_listener=rolled_back exit=$code" >&2
 exit "$code"
}
trap rollback ERR
CHANGED=true
# Preserve the bind-mounted inode, unlike atomic rename.
cat "$NEXT" > "$CONFIG"
docker exec "$NAME" nginx -t
actual_config="$(docker exec "$NAME" nginx -T 2>&1)"
grep -Fq 'server_name explorer.kriptoaman.com;' <<<"$actual_config" || { echo 'Bound container did not receive new SNI configuration' >&2; false; }
docker exec "$NAME" nginx -s reload
# NGINX performs a graceful reload. Its previous worker can still accept an
# immediate TLS handshake with the old IP SAN; wait for new SNI workers.
body="$(mktemp)"
verified=false
for attempt in $(seq 1 12); do
  if code="$(curl --noproxy '*' --fail-with-body -LsS --connect-timeout 5 --max-time 15 \
     --resolve "$DOMAIN:443:$IP" -o "$body" -w '%{http_code}' "https://$DOMAIN/" 2>/dev/null)" \
     && [[ "$code" = 200 ]] \
     && grep -Fq 'data-zvq-token-discovery="indexed-v2"' "$body"; then
    verified=true
    echo "domain_sni_new_worker_verified_attempt=$attempt"
    break
  fi
  sleep 1
done
test "$verified" = true
test "$(curl --noproxy '*' --fail-with-body -LsS --connect-timeout 5 --max-time 15 -o /dev/null -w '%{http_code}' "https://$IP/")" = 200
test "$(curl --noproxy '*' -sS --connect-timeout 5 --max-time 10 --resolve "$DOMAIN:443:$IP" -o /dev/null -w '%{http_code}' "https://$DOMAIN/rpc")" = 403
rm -f "$body" "$NEXT"
trap - ERR
echo "domain_listener=locally_verified ip_fallback=preserved backup=$BACKUP"
