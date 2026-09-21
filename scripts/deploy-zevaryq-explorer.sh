#!/usr/bin/env bash
set -Eeuo pipefail
BASE="/opt/blockscout/docker-compose"
PROXY_DIR="$BASE/proxy"
SOURCE="${1:-explorer-dashboard/zevaryq-production.html}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP="index.html.zevaryq.$STAMP.bak"
fail(){ echo "Zevaryq Explorer deploy: $*" >&2; exit 1; }
[[ -f "$SOURCE" ]] || fail "source missing"
grep -q 'data-zevaryq-explorer-version="1.0.0"' "$SOURCE" || fail "version marker missing"
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
rollback(){ code=$?; proxy_fs "cp -a /target/kam-dashboard/$BACKUP /target/kam-dashboard/index.html" || true; docker compose up -d --force-recreate proxy >/dev/null 2>&1 || true; exit "$code"; }
trap rollback ERR
proxy_fs "cat > /target/kam-dashboard/index.html && chmod 0644 /target/kam-dashboard/index.html" < "$SOURCE"
docker compose config -q
docker compose up -d --force-recreate proxy
body="$(mktemp)"; trap 'rm -f "$body"' EXIT
curl -fsSL --retry 6 --retry-all-errors --max-time 25 https://explorer.kriptoaman.com/ -o "$body"
grep -q 'data-zevaryq-explorer-version="1.0.0"' "$body"
grep -q 'ZEVARYQ EXPLORER' "$body"
curl -fsS --retry 4 --retry-all-errors --max-time 20 https://explorer.kriptoaman.com/api/v2/blocks | python3 -c 'import json,sys; assert isinstance(json.load(sys.stdin).get("items"),list)'
rpc="$(curl -fsS --retry 4 --retry-all-errors --max-time 20 -H 'content-type: application/json' --data '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}' https://rpc.kriptoaman.com)"
python3 - "$rpc" <<'PY'
import json,sys
assert json.loads(sys.argv[1]).get("result","").lower()=="0x560c"
PY
trap - ERR
echo "Zevaryq Explorer deployed; rollback=$PROXY_DIR/kam-dashboard/$BACKUP"
