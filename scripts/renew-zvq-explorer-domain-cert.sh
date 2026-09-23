#!/usr/bin/env bash
# Local renewal works through narrow ACME route, or directly after DNS-only cutover.
set -Eeuo pipefail
test "$(id -u)" -eq 0
DOMAIN=explorer.kriptoaman.com
IP=146.190.93.254
ROOT=/opt/blockscout/docker-compose/proxy/kam-dashboard
CERT=/etc/letsencrypt/live/zvq-explorer-domain/fullchain.pem
NAME=zvq-origin-ip-tls
test -r "$CERT" && test -r "$ROOT/index.html"
before="$(openssl x509 -in "$CERT" -noout -serial)"
docker run --rm --network host \
 -v "$ROOT:/var/www/html:rw" \
 -v /etc/letsencrypt:/etc/letsencrypt:rw \
 -v /var/lib/letsencrypt:/var/lib/letsencrypt:rw \
 -v /var/log/letsencrypt:/var/log/letsencrypt:rw \
 certbot/certbot:v5.7.0 renew --non-interactive --cert-name zvq-explorer-domain
openssl x509 -in "$CERT" -noout -checkend 172800 >/dev/null
openssl x509 -in "$CERT" -noout -ext subjectAltName | grep -Fq "DNS:$DOMAIN"
after="$(openssl x509 -in "$CERT" -noout -serial)"
if [[ "$before" != "$after" ]]; then
 docker exec "$NAME" nginx -t
 docker exec "$NAME" nginx -s reload
 echo "domain_certificate_rotation=reloaded"
else echo "domain_certificate_rotation=not_due"; fi
test "$(curl --noproxy '*' --fail-with-body -sS --connect-timeout 5 --max-time 12 --resolve "$DOMAIN:443:$IP" -o /dev/null -w '%{http_code}' "https://$DOMAIN/")" = 200
echo "domain_origin_tls=healthy local_renewal=verified"
