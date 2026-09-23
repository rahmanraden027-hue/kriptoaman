#!/usr/bin/env bash
# Production Let's Encrypt HTTP-01 domain cert via the isolated proof-only Worker.
set -Eeuo pipefail
DOMAIN=explorer.kriptoaman.com
ROOT=/opt/blockscout/docker-compose/proxy/kam-dashboard
TEMPLATE=/opt/blockscout/docker-compose/proxy/default.conf.template
CERTROOT=/etc/letsencrypt
IMAGE=certbot/certbot:v5.7.0
test "$(id -u)" -eq 0
test -r "$ROOT/index.html"
grep -Fq 'ZVQ_ACME_WEBROOT_V1' "$TEMPLATE"
test "$(curl --noproxy '*' --fail-with-body -sS --max-time 8 -o /dev/null -w '%{http_code}' http://127.0.0.1/)" = 200
docker run --rm --network host \
 -v "$ROOT:/var/www/html:rw" \
 -v "$CERTROOT:/etc/letsencrypt:rw" \
 -v /var/lib/letsencrypt:/var/lib/letsencrypt:rw \
 -v /var/log/letsencrypt:/var/log/letsencrypt:rw \
 "$IMAGE" certonly --non-interactive --agree-tos --register-unsafely-without-email \
 --preferred-challenges http --webroot --webroot-path /var/www/html \
 --cert-name zvq-explorer-domain --keep-until-expiring -d "$DOMAIN"
CERT="$CERTROOT/live/zvq-explorer-domain/fullchain.pem"
KEY="$CERTROOT/live/zvq-explorer-domain/privkey.pem"
test -r "$CERT" && test -r "$KEY"
openssl x509 -in "$CERT" -noout -checkend 172800 >/dev/null
openssl x509 -in "$CERT" -noout -ext subjectAltName | grep -Fq "DNS:$DOMAIN"
echo 'explorer_domain_certificate=issued; dns_san=verified; existing_ip_certificate=unchanged'
