#!/usr/bin/env bash
set -Eeuo pipefail

BASE="/opt/blockscout/docker-compose"
PROXY_DIR="$BASE/proxy"
TEMPLATE="$PROXY_DIR/default.conf.template"
SOURCE="${1:-explorer-dashboard/developer-starter.html}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_NAME="default.conf.template.kam-starter.$STAMP.bak"
STARTER_BACKUP_NAME="developer-starter.html.$STAMP.bak"
PATCHED_TEMPLATE="$(mktemp)"
VERIFY_BODY="$(mktemp)"
VERIFY_HEADERS="$(mktemp)"
HAD_STARTER=0

fail(){ echo "KAM Developer Starter deploy: $*" >&2; exit 1; }
cleanup(){ rm -f "$PATCHED_TEMPLATE" "$VERIFY_BODY" "$VERIFY_HEADERS"; }
trap cleanup EXIT

[[ -d "$BASE" && -d "$PROXY_DIR" && -f "$TEMPLATE" ]] || fail "Blockscout proxy boundary unavailable"
[[ -f "$SOURCE" ]] || fail "source not found: $SOURCE"
SOURCE="$(realpath "$SOURCE")"
grep -q 'data-kam-developer-starter-version="1.0.0"' "$SOURCE" || fail "starter marker missing"
grep -q 'wallet_switchEthereumChain' "$SOURCE" || fail "wallet switch flow missing"
grep -q 'wallet_addEthereumChain' "$SOURCE" || fail "wallet add flow missing"
grep -q "readJson('/api/v2/blocks')" "$SOURCE" || fail "same-origin blocks verification missing"
grep -q "readJson('/api/v2/stats')" "$SOURCE" || fail "same-origin stats verification missing"
! grep -q 'eth_sendTransaction' "$SOURCE" || fail "starter must remain read-only-first"

cd "$BASE"
PROXY_ID="$(docker compose ps -q proxy)"
[[ -n "$PROXY_ID" ]] || fail "proxy container unavailable"
PROXY_IMAGE="$(docker inspect "$PROXY_ID" --format '{{.Config.Image}}')"
docker image inspect "$PROXY_IMAGE" >/dev/null 2>&1 || fail "proxy image unavailable"
proxy_fs(){ docker run --rm --network none -i -v "$PROXY_DIR:/target" "$PROXY_IMAGE" sh -c "$1"; }
proxy_fs "test -r /target/default.conf.template && test -w /target"
proxy_fs "cp -a /target/default.conf.template /target/$BACKUP_NAME"
if proxy_fs "test -f /target/kam-dashboard/developer-starter.html" >/dev/null 2>&1; then
  HAD_STARTER=1
  proxy_fs "cp -a /target/kam-dashboard/developer-starter.html /target/kam-dashboard/$STARTER_BACKUP_NAME"
fi
proxy_fs "mkdir -p /target/kam-dashboard && cat > /target/kam-dashboard/developer-starter.html && chmod 0644 /target/kam-dashboard/developer-starter.html" < "$SOURCE"

python3 - "$TEMPLATE" "$PATCHED_TEMPLATE" <<'PY'
from pathlib import Path
import sys
source,out=Path(sys.argv[1]),Path(sys.argv[2])
text=source.read_text()
begin='    # KAM_DEVELOPER_STARTER_BEGIN\n'
end='    # KAM_DEVELOPER_STARTER_END\n'
if begin in text:
    before,rest=text.split(begin,1)
    if end not in rest:
        raise SystemExit('incomplete KAM Developer Starter marker')
    _,after=rest.split(end,1)
    text=before+after
needle='    location / {\n'
if needle not in text:
    raise SystemExit('frontend catch-all location not found')
block='''    # KAM_DEVELOPER_STARTER_BEGIN
    location = /developer/starter {
        root /etc/nginx/templates;
        try_files /kam-dashboard/developer-starter.html =404;
        default_type text/html;
        add_header Cache-Control "no-store, max-age=0" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header X-KAM-Developer-Starter-Version "1" always;
        add_header Content-Security-Policy "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'self'" always;
    }
    # KAM_DEVELOPER_STARTER_END
'''
out.write_text(text.replace(needle,block+needle,1))
PY

grep -Fq 'location = /developer/starter {' "$PATCHED_TEMPLATE" || fail "exact starter route missing"
grep -Fq 'try_files /kam-dashboard/developer-starter.html =404;' "$PATCHED_TEMPLATE" || fail "starter file route missing"
grep -Fq 'X-KAM-Developer-Starter-Version "1"' "$PATCHED_TEMPLATE" || fail "starter version header missing"
proxy_fs "cat > /target/default.conf.template" < "$PATCHED_TEMPLATE"

rollback(){
  code=$?
  echo "KAM Developer Starter deployment failed; restoring proxy template." >&2
  proxy_fs "cp -a /target/$BACKUP_NAME /target/default.conf.template" || true
  if [[ "$HAD_STARTER" == "1" ]]; then
    proxy_fs "cp -a /target/kam-dashboard/$STARTER_BACKUP_NAME /target/kam-dashboard/developer-starter.html" || true
  else
    proxy_fs "rm -f /target/kam-dashboard/developer-starter.html" || true
  fi
  docker compose up -d --force-recreate proxy >/dev/null 2>&1 || true
  exit "$code"
}
trap rollback ERR

docker compose up -d --force-recreate proxy

: > "$VERIFY_BODY"
curl -L -fsS --retry 6 --retry-delay 2 --retry-all-errors --max-time 25 -o "$VERIFY_BODY" 'https://explorer.kriptoaman.com/developer/starter'
grep -Fq 'data-kam-developer-starter-version="1.0.0"' "$VERIFY_BODY"
grep -Fq 'Verify Explorer' "$VERIFY_BODY"
grep -Fq 'wallet_switchEthereumChain' "$VERIFY_BODY"

: > "$VERIFY_HEADERS"
curl -L -sSIf --retry 6 --retry-delay 2 --retry-all-errors --max-time 25 -o "$VERIFY_HEADERS" 'https://explorer.kriptoaman.com/developer/starter'
grep -Eqi '^x-kam-developer-starter-version: *1' "$VERIFY_HEADERS"

curl -fsS --retry 4 --retry-all-errors --max-time 15 'https://explorer.kriptoaman.com/api/v2/blocks' | python3 -c 'import json,sys; d=json.load(sys.stdin); assert d.get("items")'
curl -fsS --retry 4 --retry-all-errors --max-time 15 'https://explorer.kriptoaman.com/developer/network.json' | python3 -c 'import json,sys; d=json.load(sys.stdin); assert d["chainId"]==22028 and d["chainIdHex"]=="0x560c"'
curl -L -fsS --retry 4 --retry-all-errors --max-time 20 'https://explorer.kriptoaman.com/developer/docs' -o /dev/null

trap - ERR
if [[ "$HAD_STARTER" == "1" ]]; then
  proxy_fs "rm -f /target/kam-dashboard/$STARTER_BACKUP_NAME"
fi
echo "KAM Developer Starter deployed successfully."
echo "backup=$PROXY_DIR/$BACKUP_NAME"
