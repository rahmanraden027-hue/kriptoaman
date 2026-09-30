#!/usr/bin/env bash
set -Eeuo pipefail

MODE="${1:-preview}"
APP_DIR=/opt/kriptoaman-market-feed
STATE_DIR=/var/lib/kriptoaman-market-feed
ENV_DIR=/etc/kriptoaman
ENV_FILE=${ENV_FILE:-/etc/kriptoaman/market-feed.env}
SERVICE=/etc/systemd/system/kriptoaman-market-feed.service
SOURCE_DIR="${SOURCE_DIR:-/tmp/kriptoaman-market-feed}"
BACKUP_DIR="/var/backups/kriptoaman-market-feed/${GITHUB_RUN_ID:-manual}"

fail(){ echo "ERROR: $*" >&2; exit 1; }
[[ "$EUID" == 0 ]] || fail "root required"
[[ "$MODE" == preview || "$MODE" == apply || "$MODE" == rollback ]] || fail "mode must be preview|apply|rollback"

if [[ "$MODE" == rollback ]]; then
  [[ -d "$BACKUP_DIR" ]] || fail "backup directory unavailable"
  if [[ -f "$BACKUP_DIR/collector.mjs" && -f "$BACKUP_DIR/model.mjs" ]]; then
    install -D -m 0750 "$BACKUP_DIR/collector.mjs" "$APP_DIR/collector.mjs"
    install -m 0640 "$BACKUP_DIR/model.mjs" "$APP_DIR/model.mjs"
    [[ ! -f "$BACKUP_DIR/service" ]] || install -m 0644 "$BACKUP_DIR/service" "$SERVICE"
    systemctl daemon-reload
    systemctl restart kriptoaman-market-feed.service
  else
    systemctl disable --now kriptoaman-market-feed.service 2>/dev/null || true
    rm -f "$SERVICE"
    systemctl daemon-reload
  fi
  echo "market_feed_rollback=complete"
  exit 0
fi

[[ -f "$SOURCE_DIR/collector.mjs" ]] || fail "collector source missing"
[[ -f "$SOURCE_DIR/model.mjs" ]] || fail "model source missing"
command -v node >/dev/null || fail "node runtime missing"
node --check "$SOURCE_DIR/collector.mjs"
node --check "$SOURCE_DIR/model.mjs"

if [[ ! -r "$ENV_FILE" ]]; then
  echo "market_feed_secret_state=not_configured"
  [[ "$MODE" == preview ]] && exit 0
  fail "environment file missing: $ENV_FILE"
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a
[[ "${KA_MARKET_INGEST_URL:-}" == https://kriptoaman.com/api/market-feed-ingest ]] || fail "unexpected ingest URL"
[[ -n "${KA_MARKET_INGEST_SECRET:-}" ]] || fail "ingest secret missing"

echo "market_feed_preflight=pass mode=$MODE ingest_url=$KA_MARKET_INGEST_URL"
[[ "$MODE" == preview ]] && exit 0

mkdir -p "$BACKUP_DIR" "$APP_DIR" "$STATE_DIR" "$ENV_DIR"
chmod 0750 "$APP_DIR" "$STATE_DIR" "$ENV_DIR"
chmod 0600 "$ENV_FILE"
[[ ! -f "$APP_DIR/collector.mjs" ]] || cp -a "$APP_DIR/collector.mjs" "$BACKUP_DIR/collector.mjs"
[[ ! -f "$APP_DIR/model.mjs" ]] || cp -a "$APP_DIR/model.mjs" "$BACKUP_DIR/model.mjs"
[[ ! -f "$SERVICE" ]] || cp -a "$SERVICE" "$BACKUP_DIR/service"
install -m 0750 "$SOURCE_DIR/collector.mjs" "$APP_DIR/collector.mjs"
install -m 0640 "$SOURCE_DIR/model.mjs" "$APP_DIR/model.mjs"

cat >"$SERVICE" <<UNIT
[Unit]
Description=KriptoAman Multi-Venue Market Feed Collector
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=root
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=production
Environment=KA_MARKET_FEED_PORT=8780
Environment=KA_MARKET_PUBLISH_INTERVAL_MS=5000
EnvironmentFile=$ENV_FILE
ExecStart=/usr/bin/node $APP_DIR/collector.mjs
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
systemctl enable --now kriptoaman-market-feed.service

ok=0
for attempt in {1..12}; do
  if health="$(curl -fsS --max-time 5 http://127.0.0.1:8780/health 2>/dev/null)"; then
    status="$(jq -r '.status // "unavailable"' <<<"$health")"
    coverage="$(jq -r '.coverage.available // 0' <<<"$health")"
    if [[ "$status" == live || "$status" == degraded ]] && (( coverage >= 5 )); then
      ok=1
      echo "$health" | jq '{status,coverage,venues,lastPublish}'
      break
    fi
  fi
  sleep 5
done

if [[ "$ok" != 1 ]]; then
  echo "market_feed_apply_gate=failed"
  GITHUB_RUN_ID="${GITHUB_RUN_ID:-manual}" SOURCE_DIR="$SOURCE_DIR" bash "$0" rollback || true
  exit 1
fi

echo "market_feed_apply_gate=pass"
