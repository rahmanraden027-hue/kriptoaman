#!/usr/bin/env bash
set -Eeuo pipefail

MODE="${1:-preview}"
APP_DIR=/opt/kriptoaman-indexer
STATE_DIR=/var/lib/kriptoaman-indexer
SERVICE=/etc/systemd/system/kriptoaman-zvq-indexer.service
SOURCE="${SOURCE:-/tmp/zvq-listener.mjs}"
BACKUP_DIR="/var/backups/kriptoaman-indexer/${GITHUB_RUN_ID:-manual}"

fail(){ echo "ERROR: $*" >&2; exit 1; }
[[ "$EUID" == 0 ]] || fail "root required"
[[ -f "$SOURCE" ]] || fail "listener source missing"
command -v node >/dev/null || fail "node runtime missing"
node --check "$SOURCE"

http_port=
for p in 8545 8547 9545; do
  if ss -H -ltn "( sport = :$p )" | grep -q .; then
    chain="$(curl -fsS --max-time 5 -H 'content-type: application/json' --data '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}' "http://127.0.0.1:$p" | jq -er '.result' 2>/dev/null || true)"
    if [[ "$chain" == 0x560c ]]; then http_port="$p"; break; fi
  fi
done
[[ -n "$http_port" ]] || fail "local ZEVARYQ HTTP RPC not found"

ws_port=
for p in 8546 8547 9546; do
  if ss -H -ltn "( sport = :$p )" | grep -q .; then ws_port="$p"; break; fi
done
[[ -n "$ws_port" ]] || fail "local WebSocket listener candidate not found"

echo "preflight_chain=0x560c http_port=$http_port ws_port=$ws_port mode=$MODE"
[[ "$MODE" == preview ]] && exit 0
[[ "$MODE" == apply || "$MODE" == rollback ]] || fail "mode must be preview|apply|rollback"

if [[ "$MODE" == rollback ]]; then
  [[ -d "$BACKUP_DIR" ]] || fail "backup directory unavailable"
  if [[ -f "$BACKUP_DIR/zvq-listener.mjs" ]]; then
    install -D -m 0750 "$BACKUP_DIR/zvq-listener.mjs" "$APP_DIR/zvq-listener.mjs"
  else
    systemctl disable --now kriptoaman-zvq-indexer.service 2>/dev/null || true
    rm -f "$SERVICE"
    systemctl daemon-reload
    exit 0
  fi
  [[ -f "$BACKUP_DIR/service" ]] && install -m 0644 "$BACKUP_DIR/service" "$SERVICE"
  systemctl daemon-reload
  systemctl restart kriptoaman-zvq-indexer.service
  exit 0
fi

mkdir -p "$BACKUP_DIR" "$APP_DIR" "$STATE_DIR"
chmod 0750 "$APP_DIR" "$STATE_DIR"
[[ ! -f "$APP_DIR/zvq-listener.mjs" ]] || cp -a "$APP_DIR/zvq-listener.mjs" "$BACKUP_DIR/zvq-listener.mjs"
[[ ! -f "$SERVICE" ]] || cp -a "$SERVICE" "$BACKUP_DIR/service"
install -m 0750 "$SOURCE" "$APP_DIR/zvq-listener.mjs"

cat >"$SERVICE" <<UNIT
[Unit]
Description=KriptoAman ZEVARYQ First-Party WebSocket Indexer
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=production
Environment=ZVQ_INDEXER_HTTP_RPC=http://127.0.0.1:$http_port
Environment=ZVQ_INDEXER_WS_RPC=ws://127.0.0.1:$ws_port
Environment=ZVQ_INDEXER_PORT=8765
Environment=ZVQ_INDEXER_STATE_DIR=$STATE_DIR
ExecStart=/usr/bin/node $APP_DIR/zvq-listener.mjs
Restart=always
RestartSec=3
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$STATE_DIR
RestrictAddressFamilies=AF_INET AF_INET6 AF_UNIX
LockPersonality=true
MemoryDenyWriteExecute=true

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl enable --now kriptoaman-zvq-indexer.service
sleep 15
systemctl is-active --quiet kriptoaman-zvq-indexer.service || fail "indexer service not active"
health="$(curl -fsS --max-time 5 http://127.0.0.1:8765/health)" || fail "indexer health unavailable"
[[ "$(jq -r '.status' <<<"$health")" == live ]] || fail "WebSocket stream is not live"
[[ "$(jq -r '.chainId' <<<"$health")" == 22028 ]] || fail "unexpected indexer chain"
echo "first_party_websocket_indexer=pass"
