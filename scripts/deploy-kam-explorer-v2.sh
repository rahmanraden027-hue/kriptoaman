#!/usr/bin/env bash
set -Eeuo pipefail

BASE="/opt/blockscout/docker-compose"
PROXY_DIR="$BASE/proxy"
TEMPLATE="$PROXY_DIR/default.conf.template"
DASHBOARD_DIR="$PROXY_DIR/kam-dashboard"
SOURCE="${1:-explorer-dashboard/index.html}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_NAME="default.conf.template.kam-v2.$STAMP.bak"
PATCHED_TEMPLATE="$(mktemp)"

fail() { echo "KAM Explorer V2 deploy: $*" >&2; exit 1; }
cleanup() { rm -f "$PATCHED_TEMPLATE"; }
trap cleanup EXIT

[[ -d "$BASE" ]] || fail "Blockscout base directory not found"
[[ -d "$PROXY_DIR" ]] || fail "Blockscout proxy directory not found"
[[ -f "$TEMPLATE" ]] || fail "proxy/default.conf.template not found"
[[ -f "$SOURCE" ]] || fail "dashboard source not found: $SOURCE"
SOURCE="$(realpath "$SOURCE")"
grep -q 'data-kam-explorer-version="2.0.0"' "$SOURCE" || fail "dashboard version marker missing"
grep -q '/api/v2/blocks' "$SOURCE" || fail "verified blocks API binding missing"
grep -q '/api/v2/transactions' "$SOURCE" || fail "verified transactions API binding missing"

cd "$BASE"
PROXY_ID="$(docker compose ps -q proxy)"
[[ -n "$PROXY_ID" ]] || fail "running Blockscout proxy container not found"
PROXY_IMAGE="$(docker inspect "$PROXY_ID" --format '{{.Config.Image}}')"
[[ -n "$PROXY_IMAGE" ]] || fail "proxy image could not be resolved"
docker image inspect "$PROXY_IMAGE" >/dev/null 2>&1 || fail "proxy image is not locally available"

# The runner can manage the existing proxy through Docker but cannot directly
# write its root-owned bind mount. Keep privileged filesystem access narrowly
# constrained to the existing Blockscout proxy directory and disable networking.
proxy_fs() {
  docker run --rm --network none -i \
    -v "$PROXY_DIR:/target" \
    "$PROXY_IMAGE" sh -c "$1"
}

proxy_fs "test -r /target/default.conf.template && test -w /target"
proxy_fs "cp -a /target/default.conf.template /target/$BACKUP_NAME"
proxy_fs "mkdir -p /target/kam-dashboard && cat > /target/kam-dashboard/index.html && chmod 0644 /target/kam-dashboard/index.html" < "$SOURCE"

python3 - "$TEMPLATE" "$PATCHED_TEMPLATE" <<'PY'
from pathlib import Path
import sys

source = Path(sys.argv[1])
out = Path(sys.argv[2])
text = source.read_text()
begin = '    # KAM_EXPLORER_V2_BEGIN\n'
end = '    # KAM_EXPLORER_V2_END\n'

if begin in text:
    before, rest = text.split(begin, 1)
    if end not in rest:
        raise SystemExit('existing KAM Explorer V2 marker is incomplete')
    _, after = rest.split(end, 1)
    text = before + after

needle = '    location / {\n'
if needle not in text:
    raise SystemExit('frontend catch-all location was not found')

# Use root + try_files rather than alias-to-file. With nginx 1.26.x an exact
# root location plus a file-valued alias can resolve as "index.htmlindex.html"
# and return HTTP 500. This pattern was reproduced and verified locally.
block = '''    # KAM_EXPLORER_V2_BEGIN
    location = / {
        root /etc/nginx/templates;
        try_files /kam-dashboard/index.html =404;
        default_type text/html;
        add_header Cache-Control "no-store, max-age=0" always;
        add_header X-KAM-Explorer-Version "2" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Content-Security-Policy "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://rpc.kriptoaman.com; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'self'" always;
    }
    # KAM_EXPLORER_V2_END
'''
text = text.replace(needle, block + needle, 1)
out.write_text(text)
PY

grep -q 'KAM_EXPLORER_V2_BEGIN' "$PATCHED_TEMPLATE"
grep -q 'root /etc/nginx/templates;' "$PATCHED_TEMPLATE"
grep -q 'try_files /kam-dashboard/index.html =404;' "$PATCHED_TEMPLATE"
! grep -q 'alias /etc/nginx/templates/kam-dashboard/index.html' "$PATCHED_TEMPLATE"
proxy_fs "cat > /target/default.conf.template" < "$PATCHED_TEMPLATE"

grep -q 'KAM_EXPLORER_V2_BEGIN' "$TEMPLATE"
grep -q 'root /etc/nginx/templates;' "$TEMPLATE"
grep -q 'try_files /kam-dashboard/index.html =404;' "$TEMPLATE"

rollback() {
  local code=$?
  echo "KAM Explorer V2 deployment failed; restoring previous proxy template." >&2
  proxy_fs "cp -a /target/$BACKUP_NAME /target/default.conf.template" || true
  cd "$BASE"
  docker compose up -d --force-recreate proxy >/dev/null 2>&1 || true
  exit "$code"
}
trap rollback ERR

docker compose up -d --force-recreate proxy
sleep 4

docker compose ps proxy
PUBLIC_HTML="$(curl -L -fsS --max-time 20 https://explorer.kriptoaman.com/)"
printf '%s' "$PUBLIC_HTML" | grep -q 'data-kam-explorer-version="2.0.0"'
printf '%s' "$PUBLIC_HTML" | grep -q 'Verified-data only'

curl -fsS --max-time 15 https://explorer.kriptoaman.com/api/v2/blocks | python3 -c 'import json,sys; d=json.load(sys.stdin); assert isinstance(d.get("items"), list) and len(d["items"])>0'
curl -fsS --max-time 15 https://explorer.kriptoaman.com/api/v2/stats | python3 -c 'import json,sys; d=json.load(sys.stdin); assert "total_transactions" in d'

KNOWN_TX="0x9854d90159013d488190d0f1847596a5dfb7582812f880102f167a1b172b163a"
curl -L -fsS --max-time 20 "https://explorer.kriptoaman.com/tx/$KNOWN_TX" >/dev/null

trap - ERR
echo "KAM Explorer V2 deployed successfully. Root dashboard is live; Blockscout API and transaction routes remain healthy."
echo "backup=$PROXY_DIR/$BACKUP_NAME"
