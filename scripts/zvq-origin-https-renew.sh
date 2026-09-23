#!/usr/bin/env bash
# Automatically renew the 160-hour Let's Encrypt IP SAN with the preverified
# HTTP-01 webroot; leave existing HTTP, Cloudflare and Blockscout untouched.
set -Eeuo pipefail
test "$(id -u)" -eq 0
ROOT='/opt/blockscout/docker-compose/proxy/kam-dashboard'
IP='146.190.93.254'
test -d "$ROOT/.well-known/acme-challenge"
docker run --rm --network host \
  -v "$ROOT:/var/www/html:rw" \
  -v /etc/letsencrypt:/etc/letsencrypt:rw \
  -v /var/lib/letsencrypt:/var/lib/letsencrypt:rw \
  -v /var/log/letsencrypt:/var/log/letsencrypt:rw \
  certbot/certbot:v5.7.0 renew --non-interactive --quiet
openssl x509 -in /etc/letsencrypt/live/zvq-origin-ip/fullchain.pem \
  -noout -checkend 86400 >/dev/null
openssl x509 -in /etc/letsencrypt/live/zvq-origin-ip/fullchain.pem \
  -noout -ext subjectAltName | grep -Fq "IP Address:$IP"
docker exec zevaryq-direct-https nginx -s reload
curl --noproxy '*' --resolve "$IP:443:127.0.0.1" \
  -fsS --connect-timeout 6 --max-time 20 "https://$IP/" -o /dev/null
echo 'zvq_shortlived_ip_tls=valid_and_reloadable; renewal_timer=executed'
