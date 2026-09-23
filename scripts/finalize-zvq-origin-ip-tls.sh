#!/usr/bin/env bash
# Finalize only after independent external IP TLS proof; otherwise undo stage.
set -Eeuo pipefail
IP=146.190.93.254
BASE=/var/lib/zvq-origin-ip-tls
NAME=zvq-origin-ip-tls
RUN_ID="$ZVQ_TLS_RUN_ID"
PROOF="$ZVQ_EXTERNAL_PROOF"
[[ "$RUN_ID" =~ ^[0-9]{7,16}$ ]] || exit 1
test "$(id -u)" -eq 0
PENDING="$BASE/pending-$RUN_ID"
if [[ "$PROOF" != success ]]; then
  if [[ -f "$PENDING" ]]; then
    docker rm -f "$NAME" >/dev/null 2>&1 || true
    if grep -Fxq 'ufw_rule_added=yes' "$PENDING"; then ufw --force delete allow 443/tcp >/dev/null || true; fi
    rm -f "$PENDING"
  fi
  echo "standalone_ip_tls=rolled_back; external_proof=$PROOF"
  exit 1
fi
test -r "$PENDING"
test "$(curl --noproxy '*' --fail-with-body -sS --connect-timeout 5 --max-time 14 -o /dev/null -w '%{http_code}' "https://$IP/")" = 200
test "$(curl --noproxy '*' -sS --connect-timeout 5 --max-time 10 -o /dev/null -w '%{http_code}' "https://$IP/rpc")" = 403
test -r scripts/renew-zvq-ip-cert.sh
install -m 0700 scripts/renew-zvq-ip-cert.sh /usr/local/sbin/zvq-origin-ip-renew
cat >/etc/systemd/system/zvq-origin-ip-renew.service <<'SYSTEMD'
[Unit]
Description=Renew ZEVARYQ origin IP certificate without changing Explorer HTTP
Wants=docker.service
After=network-online.target docker.service
[Service]
Type=oneshot
ExecStart=/usr/local/sbin/zvq-origin-ip-renew
TimeoutStartSec=900
SYSTEMD
cat >/etc/systemd/system/zvq-origin-ip-renew.timer <<'SYSTEMD'
[Unit]
Description=Check six-day ZEVARYQ origin IP certificate twice daily
[Timer]
OnCalendar=*-*-* 03,15:00:00 UTC
RandomizedDelaySec=30m
Persistent=true
Unit=zvq-origin-ip-renew.service
[Install]
WantedBy=timers.target
SYSTEMD
chmod 0644 /etc/systemd/system/zvq-origin-ip-renew.service /etc/systemd/system/zvq-origin-ip-renew.timer
systemctl daemon-reload
systemctl enable --now zvq-origin-ip-renew.timer
systemctl is-enabled --quiet zvq-origin-ip-renew.timer
systemctl is-active --quiet zvq-origin-ip-renew.timer
systemctl start zvq-origin-ip-renew.service
test "$(systemctl show -p Result --value zvq-origin-ip-renew.service)" = success
rm -f "$PENDING"
echo 'standalone_ip_tls=externally_verified; auto_renewal=active_12hour; privkey=origin_only; cloudflare_dns=unchanged'
