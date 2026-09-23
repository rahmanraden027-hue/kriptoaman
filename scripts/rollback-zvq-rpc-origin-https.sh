#!/usr/bin/env bash
# Undo only this run's *newly staged* RPC HTTPS sidecars, never older listeners.
set -Eeuo pipefail
RUN_ID="$1"
[[ "$RUN_ID" =~ ^[0-9]{7,16}$ ]] || exit 1
test "$(id -u)" -eq 0
BASE=/var/lib/zvq-rpc-origin-tls
PENDING="$BASE/pending-$RUN_ID"
[[ -f "$PENDING" ]] || { echo 'rpc_rollback=no_pending_stage'; exit 0; }
grep -Fxq "run_id=$RUN_ID" "$PENDING"
# This pending marker proves the timer, if installed, belongs to this staging run.
# Stop it before removing only the two newly staged sidecars.
if systemctl is-active --quiet zvq-rpc-origin-renew.timer; then
  systemctl disable --now zvq-rpc-origin-renew.timer
fi
if systemctl is-active --quiet zvq-rpc-origin-renew.service; then
  echo 'rpc_rollback=renewal_service_active; refusing_unsafe_removal' >&2
  exit 1
fi
docker rm -f zvq-rpc-origin-tls zvq-rpc-allowlist-gateway >/dev/null 2>&1 || true
if grep -Fxq 'ufw_rule_added=yes' "$PENDING"; then
  ufw --force delete allow 443/tcp >/dev/null || true
fi
rm -f "$PENDING"
echo 'rpc_rollback=new_sidecars_only; genesis_validators_database_unchanged=yes'
