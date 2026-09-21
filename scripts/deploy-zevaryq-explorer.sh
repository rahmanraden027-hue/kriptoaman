#!/usr/bin/env bash
set -Eeuo pipefail
BASE="/opt/blockscout/docker-compose"
PROXY_DIR="$BASE/proxy"
SOURCE="${1:-explorer-dashboard/zevaryq-production.html}"
case "$SOURCE" in
  /*) ;;
  *) SOURCE="$PWD/$SOURCE" ;;
esac
ASSET_DIR="$(dirname "$SOURCE")/assets"
EMBLEM="$ASSET_DIR/zevaryq-emblem.webp"
FAVICON="$ASSET_DIR/zevaryq-favicon.png"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP="index.html.zevaryq.$STAMP.bak"
fail(){ echo "Zevaryq Explorer deploy: $*" >&2; exit 1; }
[[ -f "$SOURCE" ]] || fail "source missing"
[[ -r "$EMBLEM" && -r "$FAVICON" ]] || fail "brand assets missing"
grep -q 'data-zevaryq-explorer-version="1.1.0"' "$SOURCE" || fail "version marker missing"
grep -q 'ZEVARYQ EXPLORER' "$SOURCE" || fail "brand marker missing"
grep -q "EXPECTED_CHAIN='0x560c'" "$SOURCE" || fail "chain guard missing"
! grep -Eqi '21[ /]+21|128\+ nodes|1,236 pending|3\.4 TPS|100% Secure' "$SOURCE" || fail "mockup metric detected"
cd "$BASE"
PROXY_ID="$(docker compose ps -q proxy)"
[[ -n "$PROXY_ID" ]] || fail "proxy container unavailable"
PROXY_IMAGE="$(docker inspect "$PROXY_ID" --format '{{.Config.Image}}')"
docker image inspect "$PROXY_IMAGE" >/dev/null
proxy_fs(){ docker run --rm --network none -i -v "$PROXY_DIR:/target" "$PROXY_IMAGE" sh -c "$1"; }
proxy_fs "test -r /target/default.conf.template && test -w /target/kam-dashboard"
proxy_fs "cp -a /target/kam-dashboard/index.html /target/kam-dashboard/$BACKUP"
proxy_fs "mkdir -p /target/kam-dashboard/zevaryq-assets; test ! -f /target/kam-dashboard/zevaryq-assets/zevaryq-emblem.webp || cp -a /target/kam-dashboard/zevaryq-assets/zevaryq-emblem.webp /target/kam-dashboard/zevaryq-assets/zevaryq-emblem.webp.$STAMP.bak; test ! -f /target/kam-dashboard/zevaryq-assets/zevaryq-favicon.png || cp -a /target/kam-dashboard/zevaryq-assets/zevaryq-favicon.png /target/kam-dashboard/zevaryq-assets/zevaryq-favicon.png.$STAMP.bak"
rollback(){ code=$?; proxy_fs "cp -a /target/kam-dashboard/$BACKUP /target/kam-dashboard/index.html; test ! -f /target/kam-dashboard/zevaryq-assets/zevaryq-emblem.webp.$STAMP.bak || cp -a /target/kam-dashboard/zevaryq-assets/zevaryq-emblem.webp.$STAMP.bak /target/kam-dashboard/zevaryq-assets/zevaryq-emblem.webp; test ! -f /target/kam-dashboard/zevaryq-assets/zevaryq-favicon.png.$STAMP.bak || cp -a /target/kam-dashboard/zevaryq-assets/zevaryq-favicon.png.$STAMP.bak /target/kam-dashboard/zevaryq-assets/zevaryq-favicon.png" || true; docker compose up -d --force-recreate proxy >/dev/null 2>&1 || true; exit "$code"; }
trap rollback ERR
proxy_fs "cat > /target/kam-dashboard/zevaryq-assets/zevaryq-emblem.webp && chmod 0644 /target/kam-dashboard/zevaryq-assets/zevaryq-emblem.webp" < "$EMBLEM"
proxy_fs "cat > /target/kam-dashboard/zevaryq-assets/zevaryq-favicon.png && chmod 0644 /target/kam-dashboard/zevaryq-assets/zevaryq-favicon.png" < "$FAVICON"
proxy_fs "cat > /target/kam-dashboard/index.html && chmod 0644 /target/kam-dashboard/index.html" < "$SOURCE"
docker compose config -q
docker compose up -d --force-recreate proxy
body="$(mktemp)"; trap 'rm -f "$body"' EXIT
# Deployment success is verified against the local Explorer origin.
# Public Cloudflare/RPC availability is verified separately by production smoke checks,
# so a transient CDN 429/5xx cannot roll back a healthy origin deployment.
curl -fsSL --retry 6 --retry-all-errors --max-time 25 -H 'Host: explorer.kriptoaman.com' http://127.0.0.1/ -o "$body"
grep -q 'data-zevaryq-explorer-version="1.1.0"' "$body"
grep -q 'ZEVARYQ EXPLORER' "$body"
curl -fsSL --retry 4 --retry-all-errors --max-time 20 -H 'Host: explorer.kriptoaman.com' http://127.0.0.1/zevaryq-assets/zevaryq-emblem.webp -o /dev/null
curl -fsSL --retry 4 --retry-all-errors --max-time 20 -H 'Host: explorer.kriptoaman.com' http://127.0.0.1/zevaryq-assets/zevaryq-favicon.png -o /dev/null
curl -fsS --retry 4 --retry-all-errors --max-time 20 -H 'Host: explorer.kriptoaman.com' http://127.0.0.1/api/v2/blocks | python3 -c 'import json,sys; assert isinstance(json.load(sys.stdin).get("items"),list)'
trap - ERR
echo "Zevaryq Explorer deployed; rollback=$PROXY_DIR/kam-dashboard/$BACKUP"
