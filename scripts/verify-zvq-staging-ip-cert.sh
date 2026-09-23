#!/usr/bin/env bash
# Requests only an untrusted Let's Encrypt STAGING IP certificate.
set -Eeuo pipefail
IP='146.190.93.254'
ROOT='/opt/blockscout/docker-compose/proxy/kam-dashboard'
TEMPLATE='/opt/blockscout/docker-compose/proxy/default.conf.template'
IMAGE='certbot/certbot:v5.7.0'
RUN_ID="$ZVQ_ACME_RUN_ID"
if [[ ! "$RUN_ID" =~ ^[0-9]{7,16}$ ]]; then echo 'Valid authorized run ID required' >&2; exit 1; fi
STAGE="/var/lib/zvq-staging-acme-$RUN_ID"
test -r "$ROOT/index.html"
grep -Fq 'data-zvq-token-discovery="indexed-v2"' "$ROOT/index.html"
grep -Fq 'ZVQ_ACME_WEBROOT_V1' "$TEMPLATE"
test "$(curl --noproxy '*' -fsS --max-time 12 -o /dev/null -w '%{http_code}' "http://$IP/")" = 200
umask 077
install -d -m 0700 "$STAGE" "$STAGE/config" "$STAGE/work" "$STAGE/logs"
cleanup() { rm -rf -- "$STAGE"; }
trap cleanup EXIT
echo "certbot_image=$IMAGE"
docker run --rm "$IMAGE" --version
docker run --rm --network host \
  -v "$ROOT:/var/www/html:rw" \
  -v "$STAGE/config:/etc/letsencrypt:rw" \
  -v "$STAGE/work:/var/lib/letsencrypt:rw" \
  -v "$STAGE/logs:/var/log/letsencrypt:rw" \
  "$IMAGE" certonly --staging --non-interactive \
  --agree-tos --register-unsafely-without-email \
  --preferred-profile shortlived --webroot \
  --webroot-path /var/www/html --ip-address "$IP" \
  --cert-name "zvq-ip-staging" \
  --keep-until-expiring
FULLCHAIN="$STAGE/config/live/zvq-ip-staging/fullchain.pem"
test -r "$FULLCHAIN"
openssl x509 -in "$FULLCHAIN" -noout -ext subjectAltName | grep -Fq "IP Address:$IP"
openssl x509 -in "$FULLCHAIN" -noout -checkend 86400 >/dev/null
echo 'staging_ip_certificate=issued; trusted=no; ip_san=verified; key_discarded_after_probe=yes'
