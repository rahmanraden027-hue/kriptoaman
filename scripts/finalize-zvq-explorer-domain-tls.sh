#!/usr/bin/env bash
set -Eeuo pipefail
test "$(id -u)" -eq 0
BASE=/var/lib/zvq-origin-ip-tls
CONFIG="$BASE/default.conf"
BACKUP="$CONFIG.domain-$ZVQ_DOMAIN_RUN_ID.bak"
PROOF="$ZVQ_EXTERNAL_PROOF"
NAME=zvq-origin-ip-tls
if [[ "$PROOF" != success ]]; then
  if [[ -r "$BACKUP" ]] && grep -Fq 'ZVQ_DOMAIN_TLS_V1' "$CONFIG"; then
    cat "$BACKUP" > "$CONFIG"
    docker exec "$NAME" nginx -t
    docker exec "$NAME" nginx -s reload
  fi
  echo "domain_tls=rolled_back; external_proof=$PROOF"
  exit 1
fi
test -r "$BACKUP"
grep -Fq 'ZVQ_DOMAIN_TLS_V1' "$CONFIG"
test -r scripts/renew-zvq-explorer-domain-cert.sh
install -m 0700 scripts/renew-zvq-explorer-domain-cert.sh /usr/local/sbin/zvq-explorer-domain-renew
cat >/etc/systemd/system/zvq-explorer-domain-renew.service <<'UNIT'
[Unit]
Description=Renew Explorer DNS SAN origin certificate by HTTP-01
Wants=docker.service
After=network-online.target docker.service
[Service]
Type=oneshot
ExecStart=/usr/local/sbin/zvq-explorer-domain-renew
TimeoutStartSec=900
UNIT
cat >/etc/systemd/system/zvq-explorer-domain-renew.timer <<'UNIT'
[Unit]
Description=Check Explorer origin domain certificate twice daily
[Timer]
OnCalendar=*-*-* 04,16:00:00 UTC
RandomizedDelaySec=30m
Persistent=true
Unit=zvq-explorer-domain-renew.service
[Install]
WantedBy=timers.target
UNIT
chmod 0644 /etc/systemd/system/zvq-explorer-domain-renew.*
systemctl daemon-reload
systemctl enable --now zvq-explorer-domain-renew.timer
systemctl is-active --quiet zvq-explorer-domain-renew.timer
systemctl start zvq-explorer-domain-renew.service
test "$(systemctl show -p Result --value zvq-explorer-domain-renew.service)" = success
echo 'domain_tls=externally_verified renewal=active_12hour ip_fallback=unchanged cloudflare_dns=unchanged'
