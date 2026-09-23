#!/usr/bin/env bash
# Production certificate only; do NOT change the active HTTP proxy or publish 443.
set -Eeuo pipefail
IP=146.190.93.254
IMAGE=certbot/certbot:v5.7.0
ROOT=/opt/blockscout/docker-compose/proxy/kam-dashboard
TEMPLATE=/opt/blockscout/docker-compose/proxy/default.conf.template
CERTROOT=/etc/letsencrypt
RUN_ID="$ZVQ_TLS_RUN_ID"
[[ "$RUN_ID" =~ ^[0-9]{7,16}$ ]] || { echo 'Missing authorized production issuance run ID' >&2; exit 1; }
test -r "$ROOT/index.html"
grep -Fq 'data-zvq-token-discovery="indexed-v2"' "$ROOT/index.html"
grep -Fq 'ZVQ_ACME_WEBROOT_V1' "$TEMPLATE"
test "$(curl --noproxy '*' --max-time 8 -sS -o /dev/null -w '%{http_code}' "http://$IP/")" = 200
umask 077
install -d -m 0700 "$CERTROOT" /var/lib/letsencrypt /var/log/letsencrypt
docker run --rm --network host \
 -v "$ROOT:/var/www/html:rw" \
 -v "$CERTROOT:/etc/letsencrypt:rw" \
 -v /var/lib/letsencrypt:/var/lib/letsencrypt:rw \
 -v /var/log/letsencrypt:/var/log/letsencrypt:rw \
 "$IMAGE" certonly --non-interactive \
 --agree-tos --register-unsafely-without-email \
 --preferred-profile shortlived \
 --webroot --webroot-path /var/www/html \
 --ip-address "$IP" --cert-name zvq-origin-ip \
 --keep-until-expiring
CERT="$CERTROOT/live/zvq-origin-ip/fullchain.pem"
KEY="$CERTROOT/live/zvq-origin-ip/privkey.pem"
test -r "$CERT"
test -r "$KEY"
openssl x509 -in "$CERT" -noout -ext subjectAltName | grep -Fq "IP Address:$IP"
openssl x509 -in "$CERT" -noout -checkend 259200 >/dev/null
# Do not echo private-key content, ACME account material, or certificate PEM.
openssl x509 -in "$CERT" -noout -enddate
echo 'trusted_ip_certificate=issued; ip_san=verified; expiry_window_gt_72h=yes; port_443_unchanged=yes'
