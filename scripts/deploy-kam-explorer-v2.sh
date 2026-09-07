#!/usr/bin/env bash
set -Eeuo pipefail

BASE="/opt/blockscout/docker-compose"
PROXY_DIR="$BASE/proxy"
TEMPLATE="$PROXY_DIR/default.conf.template"
SOURCE="${1:-explorer-dashboard/index.html}"
STATS_SOURCE="${2:-explorer-dashboard/stats.html}"
TOKENS_SOURCE="${3:-explorer-dashboard/tokens.html}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_NAME="default.conf.template.kam-v2.$STAMP.bak"
PATCHED_TEMPLATE="$(mktemp)"
fail(){ echo "KAM Explorer V2 deploy: $*" >&2; exit 1; }
cleanup(){ rm -f "$PATCHED_TEMPLATE"; }
trap cleanup EXIT

[[ -d "$BASE" && -d "$PROXY_DIR" && -f "$TEMPLATE" ]] || fail "Blockscout proxy boundary unavailable"
for f in "$SOURCE" "$STATS_SOURCE" "$TOKENS_SOURCE"; do [[ -f "$f" ]] || fail "source not found: $f"; done
SOURCE="$(realpath "$SOURCE")"; STATS_SOURCE="$(realpath "$STATS_SOURCE")"; TOKENS_SOURCE="$(realpath "$TOKENS_SOURCE")"
grep -q 'data-kam-explorer-version="2.0.0"' "$SOURCE" || fail "homepage marker missing"
grep -q 'data-kam-stats-version="2.0.0"' "$STATS_SOURCE" || fail "stats marker missing"
grep -q 'data-kam-tokens-version="2.0.0"' "$TOKENS_SOURCE" || fail "token registry marker missing"

cd "$BASE"
PROXY_ID="$(docker compose ps -q proxy)"; [[ -n "$PROXY_ID" ]] || fail "proxy container unavailable"
PROXY_IMAGE="$(docker inspect "$PROXY_ID" --format '{{.Config.Image}}')"; docker image inspect "$PROXY_IMAGE" >/dev/null 2>&1 || fail "proxy image unavailable"
proxy_fs(){ docker run --rm --network none -i -v "$PROXY_DIR:/target" "$PROXY_IMAGE" sh -c "$1"; }
proxy_fs "test -r /target/default.conf.template && test -w /target"
proxy_fs "cp -a /target/default.conf.template /target/$BACKUP_NAME"
proxy_fs "mkdir -p /target/kam-dashboard && cat > /target/kam-dashboard/index.html && chmod 0644 /target/kam-dashboard/index.html" < "$SOURCE"
proxy_fs "cat > /target/kam-dashboard/stats.html && chmod 0644 /target/kam-dashboard/stats.html" < "$STATS_SOURCE"
proxy_fs "cat > /target/kam-dashboard/tokens.html && chmod 0644 /target/kam-dashboard/tokens.html" < "$TOKENS_SOURCE"

python3 - "$TEMPLATE" "$PATCHED_TEMPLATE" <<'PY'
from pathlib import Path
import sys
source,out=Path(sys.argv[1]),Path(sys.argv[2]); text=source.read_text()
begin='    # KAM_EXPLORER_V2_BEGIN\n'; end='    # KAM_EXPLORER_V2_END\n'
if begin in text:
    before,rest=text.split(begin,1)
    if end not in rest: raise SystemExit('incomplete KAM Explorer V2 marker')
    _,after=rest.split(end,1); text=before+after
needle='    location / {\n'
if needle not in text: raise SystemExit('frontend catch-all location not found')
headers='''        add_header Cache-Control "no-store, max-age=0" always;\n        add_header X-Content-Type-Options "nosniff" always;\n        add_header Referrer-Policy "strict-origin-when-cross-origin" always;\n'''
block=f'''    # KAM_EXPLORER_V2_BEGIN
    location = / {{
        root /etc/nginx/templates;
        try_files /kam-dashboard/index.html =404;
        default_type text/html;
{headers}        add_header X-KAM-Explorer-Version "2" always;
        add_header Content-Security-Policy "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://rpc.kriptoaman.com; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'self'" always;
    }}
    location = /stats {{
        root /etc/nginx/templates;
        try_files /kam-dashboard/stats.html =404;
        default_type text/html;
{headers}        add_header X-KAM-Explorer-Stats-Version "2" always;
        add_header Content-Security-Policy "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'self'" always;
    }}
    location = /tokens {{
        root /etc/nginx/templates;
        try_files /kam-dashboard/tokens.html =404;
        default_type text/html;
{headers}        add_header X-KAM-Explorer-Tokens-Version "2" always;
        add_header Content-Security-Policy "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'self'" always;
    }}
    # KAM_EXPLORER_V2_END
'''
out.write_text(text.replace(needle,block+needle,1))
PY
for needle in 'try_files /kam-dashboard/index.html =404;' 'try_files /kam-dashboard/stats.html =404;' 'try_files /kam-dashboard/tokens.html =404;'; do grep -q "$needle" "$PATCHED_TEMPLATE" || fail "nginx route patch missing"; done
proxy_fs "cat > /target/default.conf.template" < "$PATCHED_TEMPLATE"

rollback(){ code=$?; echo "KAM Explorer V2 deployment failed; restoring proxy template." >&2; proxy_fs "cp -a /target/$BACKUP_NAME /target/default.conf.template" || true; docker compose up -d --force-recreate proxy >/dev/null 2>&1 || true; exit "$code"; }
trap rollback ERR
docker compose up -d --force-recreate proxy
sleep 4

curl -L -fsS --max-time 20 https://explorer.kriptoaman.com/ | grep -q 'data-kam-explorer-version="2.0.0"'
curl -L -fsS --max-time 20 https://explorer.kriptoaman.com/stats | grep -q 'data-kam-stats-version="2.0.0"'
curl -L -fsS --max-time 20 https://explorer.kriptoaman.com/tokens | grep -q 'data-kam-tokens-version="2.0.0"'
curl -L -sSI --max-time 20 https://explorer.kriptoaman.com/stats | grep -Ei '^x-kam-explorer-stats-version: *2' >/dev/null
curl -L -sSI --max-time 20 https://explorer.kriptoaman.com/tokens | grep -Ei '^x-kam-explorer-tokens-version: *2' >/dev/null
curl -fsS --max-time 15 https://explorer.kriptoaman.com/api/v2/blocks | python3 -c 'import json,sys; d=json.load(sys.stdin); assert d.get("items")'
curl -fsS --max-time 15 https://explorer.kriptoaman.com/api/v2/stats | python3 -c 'import json,sys; d=json.load(sys.stdin); assert "total_transactions" in d'
KNOWN_TX="0x9854d90159013d488190d0f1847596a5dfb7582812f880102f167a1b172b163a"
CANONICAL_WKAM="0x0d8848CE88BB09a81a4248Efdd574d50B98b544A"
curl -L -fsS --max-time 20 "https://explorer.kriptoaman.com/tx/$KNOWN_TX" >/dev/null
curl -L -fsS --max-time 20 "https://explorer.kriptoaman.com/token/$CANONICAL_WKAM" >/dev/null
trap - ERR
echo "KAM Explorer V2 deployed successfully: overview, verified statistics, and canonical token registry are live."
echo "backup=$PROXY_DIR/$BACKUP_NAME"
