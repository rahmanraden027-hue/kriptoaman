#!/usr/bin/env bash
# Run only after independent GitHub-hosted proof succeeds.
set -Eeuo pipefail
RUN_ID="$1"
PROOF="$2"
[[ "$RUN_ID" =~ ^[0-9]{7,16}$ ]] || exit 1
test "$(id -u)" -eq 0
BASE=/var/lib/zvq-rpc-origin-tls
PENDING="$BASE/pending-$RUN_ID"
if [[ "$PROOF" != success ]]; then
  /tmp/rollback-zvq-rpc-origin-https.sh "$RUN_ID"
  echo "rpc_tls_finalization=blocked; external_proof=$PROOF" >&2
  exit 1
fi
test -f "$PENDING"
grep -Fxq "run_id=$RUN_ID" "$PENDING"
CERT=/etc/letsencrypt/live/zvq-rpc-origin/fullchain.pem
openssl x509 -in "$CERT" -noout -checkend 172800 >/dev/null
chain="$(curl --noproxy '*' --fail-with-body -sS --connect-timeout 6 --max-time 15 \
 -H 'content-type: application/json' \
 --data '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}' \
 'https://206.189.36.15/' | jq -er '.result')"
test "$chain" = 0x560c
install -m 0700 /tmp/renew-zvq-rpc-origin-cert.sh /usr/local/sbin/zvq-rpc-origin-renew
cat >/etc/systemd/system/zvq-rpc-origin-renew.service <<'UNIT'
[Unit]
Description=Safely renew ZEVARYQ direct RPC IP TLS certificate
Wants=docker.service network-online.target
After=network-online.target docker.service
[Service]
Type=oneshot
ExecStart=/usr/local/sbin/zvq-rpc-origin-renew
TimeoutStartSec=900
UNIT
cat >/etc/systemd/system/zvq-rpc-origin-renew.timer <<'UNIT'
[Unit]
Description=Check short-lived ZEVARYQ RPC IP TLS twice daily
[Timer]
OnCalendar=*-*-* 02,14:00:00 UTC
RandomizedDelaySec=15m
Persistent=true
Unit=zvq-rpc-origin-renew.service
[Install]
WantedBy=timers.target
UNIT
chmod 0644 /etc/systemd/system/zvq-rpc-origin-renew.service /etc/systemd/system/zvq-rpc-origin-renew.timer
systemctl daemon-reload
systemctl enable --now zvq-rpc-origin-renew.timer
systemctl is-enabled --quiet zvq-rpc-origin-renew.timer
systemctl is-active --quiet zvq-rpc-origin-renew.timer
systemctl start zvq-rpc-origin-renew.service
test "$(systemctl show -p Result --value zvq-rpc-origin-renew.service)" = success
rm -f "$PENDING"
echo 'rpc_origin_tls=externally_verified; renewal=active_12hour; rollback_stage=completed; rpc_dns_unchanged=yes'
