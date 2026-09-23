#!/usr/bin/env bash
# Issue/refresh a browser-trusted *IP-address* certificate. Does not change listeners,
# DNS, Cloudflare, firewall, existing NGINX or blockchain services.
set -Eeuo pipefail
IP=146.190.93.254
ROOT=/opt/blockscout/docker-compose/proxy/kam-dashboard
CONF=/opt/blockscout/docker-compose/proxy/default.conf.template
BASE=/var/lib/zvq-origin-ip-tls
IMAGE=certbot/certbot:v5.7.0
CERT=zvq-ip-production
test "$(id -u)" -eq 0
test -r "$ROOT/index.html"
grep -Fq 'data-zvq-token-discovery="indexed-v2"' "$ROOT/index.html"
grep -Fq 'ZVQ_ACME_WEBROOT_V1' "$CONF"
test "$(curl --noproxy '*' -fsS --connect-timeout 5 --max-time 12 -o /dev/null -w '%{http_code}' "http://$IP/")" = 200
umask 077
install -d -m 0700 "$BASE" "$BASE/config" "$BASE/work" "$BASE/logs"
CHAIN="$BASE/config/live/$CERT/fullchain.pem"
KEY="$BASE/config/live/$CERT/privkey.pem"
if [[ -r "$CHAIN" && -r "$KEY" ]] &&
   openssl x509 -in "$CHAIN" -noout -checkend 172800 >/dev/null &&
   openssl x509 -in "$CHAIN" -noout -ext subjectAltName | grep -Fq "IP Address:$IP"; then
  echo 'trusted_ip_certificate=already_valid; issuance_skipped=yes'
  exit 0
fi
docker run --rm --network host \
  --mount "type=bind,src=$ROOT,dst=/var/www/html" \
  --mount "type=bind,src=$BASE/config,dst=/etc/letsencrypt" \
  --mount "type=bind,src=$BASE/work,dst=/var/lib/letsencrypt" \
  --mount "type=bind,src=$BASE/logs,dst=/var/log/letsencrypt" \
  "$IMAGE" certonly --non-interactive --agree-tos \
  --register-unsafely-without-email --preferred-profile shortlived \
  --webroot --webroot-path /var/www/html --ip-address "$IP" \
  --cert-name "$CERT" --keep-until-expiring
test -r "$CHAIN" && test -r "$KEY"
openssl x509 -in "$CHAIN" -noout -checkend 86400 >/dev/null
openssl x509 -in "$CHAIN" -noout -ext subjectAltName | grep -Fq "IP Address:$IP"
test "$(stat -c '%a' "$BASE")" = 700
echo 'trusted_ip_certificate=issued; ip_san=verified; credentials=retained_private; origin_listener=unchanged'
