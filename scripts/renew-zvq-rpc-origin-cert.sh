#!/usr/bin/env bash
# Root-owned, twice-daily renewal of the existing six-day IP certificate.
# Never touches public Cloudflare routes, RPC state, or other TLS listeners.
set -Eeuo pipefail
IP=206.189.36.15
NAME=zvq-rpc-origin-tls
CERT=/etc/letsencrypt/live/zvq-rpc-origin/fullchain.pem
KEY=/etc/letsencrypt/live/zvq-rpc-origin/privkey.pem
test "$(id -u)" -eq 0
test -r "$CERT" && test -r "$KEY"
test "$(docker inspect --format '{{.State.Running}}' "$NAME")" = true
# Standalone HTTP-01 must not interrupt an existing HTTP service.
if ss -H -ltn '( sport = :80 )' | grep -q .; then
  echo 'rpc_cert_renewal_blocked=port_80_busy' >&2
  logger -p daemon.err -t zvq-rpc-tls 'Certificate renewal blocked because port 80 is occupied'
  exit 1
fi
before="$(openssl x509 -in "$CERT" -noout -serial)"
docker run --rm --network host \
  -v /etc/letsencrypt:/etc/letsencrypt:rw \
  -v /var/lib/letsencrypt:/var/lib/letsencrypt:rw \
  -v /var/log/letsencrypt:/var/log/letsencrypt:rw \
  certbot/certbot:v5.7.0 renew --non-interactive --cert-name zvq-rpc-origin \
  --preferred-profile shortlived
openssl x509 -in "$CERT" -noout -checkend 172800 >/dev/null || {
  logger -p daemon.err -t zvq-rpc-tls 'IP TLS certificate has less than 48 hours remaining'
  exit 1
}
openssl x509 -in "$CERT" -noout -ext subjectAltName | grep -Fq "IP Address:$IP"
after="$(openssl x509 -in "$CERT" -noout -serial)"
if [[ "$before" != "$after" ]]; then
  docker exec "$NAME" nginx -t
  docker exec "$NAME" nginx -s reload
  echo 'rpc_certificate_rotation=nginx_reloaded'
else
  echo 'rpc_certificate_rotation=not_due'
fi
chain="$(curl --noproxy '*' --fail-with-body -sS --connect-timeout 4 --max-time 12 \
  -H 'content-type: application/json' \
  --data '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}' \
  "https://$IP/" | jq -er '.result')"
test "$chain" = 0x560c
echo 'rpc_origin_certificate=trusted; auto_renewal=verified; chain_state=unchanged'
