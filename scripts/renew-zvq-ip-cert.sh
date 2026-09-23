#!/usr/bin/env bash
# Automated short-lived Let's Encrypt IP SAN renewal, independently of Cloudflare.
set -Eeuo pipefail
IP=146.190.93.254
CERT=/etc/letsencrypt/live/zvq-origin-ip/fullchain.pem
KEY=/etc/letsencrypt/live/zvq-origin-ip/privkey.pem
ROOT=/opt/blockscout/docker-compose/proxy/kam-dashboard
IMAGE=certbot/certbot:v5.7.0
NAME=zvq-origin-ip-tls
test "$(id -u)" -eq 0
test -r "$CERT" && test -r "$KEY"
grep -Fq 'ZVQ_ACME_WEBROOT_V1' /opt/blockscout/docker-compose/proxy/default.conf.template
before="$(openssl x509 -in "$CERT" -noout -serial)"
docker run --rm --network host \
 -v "$ROOT:/var/www/html:rw" \
 -v /etc/letsencrypt:/etc/letsencrypt:rw \
 -v /var/lib/letsencrypt:/var/lib/letsencrypt:rw \
 -v /var/log/letsencrypt:/var/log/letsencrypt:rw \
 "$IMAGE" renew --non-interactive --cert-name zvq-origin-ip \
 --preferred-profile shortlived
openssl x509 -in "$CERT" -noout -checkend 172800 >/dev/null
openssl x509 -in "$CERT" -noout -ext subjectAltName | grep -Fq "IP Address:$IP"
after="$(openssl x509 -in "$CERT" -noout -serial)"
if [[ "$before" != "$after" ]]; then
  docker exec "$NAME" nginx -s reload
  echo 'certificate_rotation=nginx_reloaded'
else
  echo 'certificate_rotation=not_due'
fi
status="$(curl --noproxy '*' --fail-with-body -sS --connect-timeout 4 --max-time 12 -o /dev/null -w '%{http_code}' "https://$IP/")"
test "$status" = 200
echo 'trusted_ip_certificate=healthy; ip_san=verified; next_renewal=systemd_timer'
