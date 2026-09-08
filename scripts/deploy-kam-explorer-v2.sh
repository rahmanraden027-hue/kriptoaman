#!/usr/bin/env bash
set -Eeuo pipefail

BASE="/opt/blockscout/docker-compose"
PROXY_DIR="$BASE/proxy"
TEMPLATE="$PROXY_DIR/default.conf.template"
SOURCE="${1:-explorer-dashboard/index.html}"
STATS_SOURCE="${2:-explorer-dashboard/stats.html}"
TOKENS_SOURCE="${3:-explorer-dashboard/tokens.html}"
DEVELOPER_SOURCE="${4:-explorer-dashboard/developer.html}"
ADDRESSES_SOURCE="${5:-explorer-dashboard/addresses.html}"
VALIDATORS_SOURCE="${6:-explorer-dashboard/validators.html}"
CONTRACTS_SOURCE="${7:-explorer-dashboard/contracts.html}"
STATUS_SOURCE="${8:-explorer-dashboard/status.html}"
DOCS_SOURCE="${9:-explorer-dashboard/developer-docs.html}"
EXAMPLES_SOURCE="${10:-explorer-dashboard/developer-examples.html}"
VERIFY_SOURCE="${11:-explorer-dashboard/developer-verify.html}"
NETWORK_SOURCE="${12:-explorer-dashboard/developer-network.json}"
BLOCKS_SOURCE="${13:-explorer-dashboard/blocks.html}"
TRANSACTIONS_SOURCE="${14:-explorer-dashboard/transactions.html}"
API_SOURCE="${15:-explorer-dashboard/api-docs.html}"
TX_DETAIL_SOURCE="${16:-explorer-dashboard/transaction-detail.html}"
BLOCK_DETAIL_SOURCE="${17:-explorer-dashboard/block-detail.html}"
ADDRESS_DETAIL_SOURCE="${18:-explorer-dashboard/address-detail.html}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_NAME="default.conf.template.kam-v2.$STAMP.bak"
PATCHED_TEMPLATE="$(mktemp)"
VERIFY_BODY="$(mktemp)"
VERIFY_HEADERS="$(mktemp)"
fail(){ echo "KAM Explorer V2 deploy: $*" >&2; exit 1; }
cleanup(){ rm -f "$PATCHED_TEMPLATE" "$VERIFY_BODY" "$VERIFY_HEADERS"; }
trap cleanup EXIT

[[ -d "$BASE" && -d "$PROXY_DIR" && -f "$TEMPLATE" ]] || fail "Blockscout proxy boundary unavailable"
for f in "$SOURCE" "$STATS_SOURCE" "$TOKENS_SOURCE" "$DEVELOPER_SOURCE" "$ADDRESSES_SOURCE" "$VALIDATORS_SOURCE" "$CONTRACTS_SOURCE" "$STATUS_SOURCE" "$DOCS_SOURCE" "$EXAMPLES_SOURCE" "$VERIFY_SOURCE" "$NETWORK_SOURCE" "$BLOCKS_SOURCE" "$TRANSACTIONS_SOURCE" "$API_SOURCE" "$TX_DETAIL_SOURCE" "$BLOCK_DETAIL_SOURCE" "$ADDRESS_DETAIL_SOURCE"; do
  [[ -f "$f" ]] || fail "source not found: $f"
done
SOURCE="$(realpath "$SOURCE")"
STATS_SOURCE="$(realpath "$STATS_SOURCE")"
TOKENS_SOURCE="$(realpath "$TOKENS_SOURCE")"
DEVELOPER_SOURCE="$(realpath "$DEVELOPER_SOURCE")"
ADDRESSES_SOURCE="$(realpath "$ADDRESSES_SOURCE")"
VALIDATORS_SOURCE="$(realpath "$VALIDATORS_SOURCE")"
CONTRACTS_SOURCE="$(realpath "$CONTRACTS_SOURCE")"
STATUS_SOURCE="$(realpath "$STATUS_SOURCE")"
DOCS_SOURCE="$(realpath "$DOCS_SOURCE")"
EXAMPLES_SOURCE="$(realpath "$EXAMPLES_SOURCE")"
VERIFY_SOURCE="$(realpath "$VERIFY_SOURCE")"
NETWORK_SOURCE="$(realpath "$NETWORK_SOURCE")"
BLOCKS_SOURCE="$(realpath "$BLOCKS_SOURCE")"
TRANSACTIONS_SOURCE="$(realpath "$TRANSACTIONS_SOURCE")"
API_SOURCE="$(realpath "$API_SOURCE")"
TX_DETAIL_SOURCE="$(realpath "$TX_DETAIL_SOURCE")"
BLOCK_DETAIL_SOURCE="$(realpath "$BLOCK_DETAIL_SOURCE")"
ADDRESS_DETAIL_SOURCE="$(realpath "$ADDRESS_DETAIL_SOURCE")"
grep -q 'data-kam-explorer-version="2.0.0"' "$SOURCE" || fail "homepage marker missing"
grep -q 'data-kam-stats-version="2.0.0"' "$STATS_SOURCE" || fail "stats marker missing"
grep -q 'data-kam-tokens-version="2.0.0"' "$TOKENS_SOURCE" || fail "token registry marker missing"
grep -q 'data-kam-developer-version="1.0.0"' "$DEVELOPER_SOURCE" || fail "developer marker missing"
grep -q 'data-kam-addresses-version="1.0.0"' "$ADDRESSES_SOURCE" || fail "addresses marker missing"
grep -q 'data-kam-validators-version="1.0.0"' "$VALIDATORS_SOURCE" || fail "proposer observatory marker missing"
grep -q 'data-kam-contracts-version="1.0.0"' "$CONTRACTS_SOURCE" || fail "contracts marker missing"
grep -q 'data-kam-status-version="1.0.0"' "$STATUS_SOURCE" || fail "status marker missing"
grep -q 'data-kam-developer-docs-version="1.0.0"' "$DOCS_SOURCE" || fail "developer docs marker missing"
grep -q 'data-kam-developer-examples-version="1.0.0"' "$EXAMPLES_SOURCE" || fail "developer examples marker missing"
grep -q 'data-kam-developer-verify-version="1.0.0"' "$VERIFY_SOURCE" || fail "developer verify marker missing"
grep -q 'data-kam-blocks-version="1.0.0"' "$BLOCKS_SOURCE" || fail "blocks marker missing"
grep -q 'data-kam-transactions-version="1.0.0"' "$TRANSACTIONS_SOURCE" || fail "transactions marker missing"
grep -q 'data-kam-api-version="1.0.0"' "$API_SOURCE" || fail "API marker missing"
grep -q 'data-kam-transaction-detail-version="1.0.0"' "$TX_DETAIL_SOURCE" || fail "transaction detail marker missing"
grep -q 'data-kam-block-detail-version="1.0.0"' "$BLOCK_DETAIL_SOURCE" || fail "block detail marker missing"
grep -q 'data-kam-address-detail-version="1.0.0"' "$ADDRESS_DETAIL_SOURCE" || fail "address detail marker missing"
! grep -Eq 'http://localhost|127\.0\.0\.1' "$API_SOURCE" || fail "API page must not reference localhost"
python3 - "$NETWORK_SOURCE" <<'PY'
import json,sys
with open(sys.argv[1], encoding='utf-8') as fh: d=json.load(fh)
assert d['chainId']==22028 and d['chainIdHex']=='0x560c'
assert d['nativeCurrency']['symbol']=='KAM' and d['nativeCurrency']['decimals']==18
assert d['rpcUrls']==['https://rpc.kriptoaman.com']
assert d['blockExplorerUrls']==['https://explorer.kriptoaman.com']
assert d['security']['privateKeysRequired'] is False
PY

cd "$BASE"
PROXY_ID="$(docker compose ps -q proxy)"
[[ -n "$PROXY_ID" ]] || fail "proxy container unavailable"
PROXY_IMAGE="$(docker inspect "$PROXY_ID" --format '{{.Config.Image}}')"
docker image inspect "$PROXY_IMAGE" >/dev/null 2>&1 || fail "proxy image unavailable"
proxy_fs(){ docker run --rm --network none -i -v "$PROXY_DIR:/target" "$PROXY_IMAGE" sh -c "$1"; }
proxy_fs "test -r /target/default.conf.template && test -w /target"
proxy_fs "cp -a /target/default.conf.template /target/$BACKUP_NAME"
proxy_fs "mkdir -p /target/kam-dashboard && cat > /target/kam-dashboard/index.html && chmod 0644 /target/kam-dashboard/index.html" < "$SOURCE"
proxy_fs "cat > /target/kam-dashboard/stats.html && chmod 0644 /target/kam-dashboard/stats.html" < "$STATS_SOURCE"
proxy_fs "cat > /target/kam-dashboard/tokens.html && chmod 0644 /target/kam-dashboard/tokens.html" < "$TOKENS_SOURCE"
proxy_fs "cat > /target/kam-dashboard/developer.html && chmod 0644 /target/kam-dashboard/developer.html" < "$DEVELOPER_SOURCE"
proxy_fs "cat > /target/kam-dashboard/addresses.html && chmod 0644 /target/kam-dashboard/addresses.html" < "$ADDRESSES_SOURCE"
proxy_fs "cat > /target/kam-dashboard/validators.html && chmod 0644 /target/kam-dashboard/validators.html" < "$VALIDATORS_SOURCE"
proxy_fs "cat > /target/kam-dashboard/contracts.html && chmod 0644 /target/kam-dashboard/contracts.html" < "$CONTRACTS_SOURCE"
proxy_fs "cat > /target/kam-dashboard/status.html && chmod 0644 /target/kam-dashboard/status.html" < "$STATUS_SOURCE"
proxy_fs "cat > /target/kam-dashboard/developer-docs.html && chmod 0644 /target/kam-dashboard/developer-docs.html" < "$DOCS_SOURCE"
proxy_fs "cat > /target/kam-dashboard/developer-examples.html && chmod 0644 /target/kam-dashboard/developer-examples.html" < "$EXAMPLES_SOURCE"
proxy_fs "cat > /target/kam-dashboard/developer-verify.html && chmod 0644 /target/kam-dashboard/developer-verify.html" < "$VERIFY_SOURCE"
proxy_fs "cat > /target/kam-dashboard/developer-network.json && chmod 0644 /target/kam-dashboard/developer-network.json" < "$NETWORK_SOURCE"
proxy_fs "cat > /target/kam-dashboard/blocks.html && chmod 0644 /target/kam-dashboard/blocks.html" < "$BLOCKS_SOURCE"
proxy_fs "cat > /target/kam-dashboard/transactions.html && chmod 0644 /target/kam-dashboard/transactions.html" < "$TRANSACTIONS_SOURCE"
proxy_fs "cat > /target/kam-dashboard/api-docs.html && chmod 0644 /target/kam-dashboard/api-docs.html" < "$API_SOURCE"
proxy_fs "cat > /target/kam-dashboard/transaction-detail.html && chmod 0644 /target/kam-dashboard/transaction-detail.html" < "$TX_DETAIL_SOURCE"
proxy_fs "cat > /target/kam-dashboard/block-detail.html && chmod 0644 /target/kam-dashboard/block-detail.html" < "$BLOCK_DETAIL_SOURCE"
proxy_fs "cat > /target/kam-dashboard/address-detail.html && chmod 0644 /target/kam-dashboard/address-detail.html" < "$ADDRESS_DETAIL_SOURCE"

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
def route(path, filename, header, version='1', connect="'self'"):
    return f'''    location = {path} {{\n        root /etc/nginx/templates;\n        try_files /kam-dashboard/{filename} =404;\n        default_type text/html;\n{headers}        add_header {header} "{version}" always;\n        add_header Content-Security-Policy "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src {connect}; img-src 'self' data: https://kriptoaman.com; object-src 'none'; base-uri 'self'; frame-ancestors 'self'" always;\n    }}\n'''
def json_route(path, filename, header, version='1'):
    return f'''    location = {path} {{\n        root /etc/nginx/templates;\n        try_files /kam-dashboard/{filename} =404;\n        default_type application/json;\n{headers}        add_header {header} "{version}" always;\n        add_header Content-Security-Policy "default-src 'none'; frame-ancestors 'none'" always;\n    }}\n'''
def dynamic_route(pattern, filename, header, version='1'):
    return f'''    location ~ "{pattern}" {{\n        root /etc/nginx/templates;\n        try_files /kam-dashboard/{filename} =404;\n        default_type text/html;\n{headers}        add_header {header} "{version}" always;\n        add_header Content-Security-Policy "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data: https://kriptoaman.com; object-src 'none'; base-uri 'self'; frame-ancestors 'self'" always;\n    }}\n'''
block='    # KAM_EXPLORER_V2_BEGIN\n'
block+=route('/', 'index.html', 'X-KAM-Explorer-Version', '2', "'self' https://rpc.kriptoaman.com")
block+=route('/stats', 'stats.html', 'X-KAM-Explorer-Stats-Version', '2')
block+=route('/tokens', 'tokens.html', 'X-KAM-Explorer-Tokens-Version', '2')
block+=route('/developer', 'developer.html', 'X-KAM-Explorer-Developer-Version')
block+=route('/developers', 'developer.html', 'X-KAM-Explorer-Developer-Version')
block+=route('/developer/docs', 'developer-docs.html', 'X-KAM-Developer-Docs-Version')
block+=route('/developer/examples', 'developer-examples.html', 'X-KAM-Developer-Examples-Version')
block+=route('/developer/verify', 'developer-verify.html', 'X-KAM-Developer-Verify-Version')
block+=json_route('/developer/network.json', 'developer-network.json', 'X-KAM-Developer-Network-Version')
block+=route('/addresses', 'addresses.html', 'X-KAM-Explorer-Addresses-Version')
block+=route('/validators', 'validators.html', 'X-KAM-Explorer-Validators-Version')
block+=route('/contracts', 'contracts.html', 'X-KAM-Explorer-Contracts-Version')
block+=route('/status', 'status.html', 'X-KAM-Explorer-Status-Version')
block+=route('/blocks', 'blocks.html', 'X-KAM-Explorer-Blocks-Version')
block+=route('/txs', 'transactions.html', 'X-KAM-Explorer-Transactions-Version')
block+=route('/api-docs', 'api-docs.html', 'X-KAM-Explorer-API-Version')
block+=dynamic_route('^/tx/0x[0-9a-fA-F]{64}$', 'transaction-detail.html', 'X-KAM-Transaction-Detail-Version')
block+=dynamic_route('^/block/(?:[0-9]+|0x[0-9a-fA-F]{64})$', 'block-detail.html', 'X-KAM-Block-Detail-Version')
block+=dynamic_route('^/address/0x[0-9a-fA-F]{40}$', 'address-detail.html', 'X-KAM-Address-Detail-Version')
block+='    # KAM_EXPLORER_V2_END\n'
out.write_text(text.replace(needle,block+needle,1))
PY
for needle in \
  'try_files /kam-dashboard/index.html =404;' \
  'try_files /kam-dashboard/stats.html =404;' \
  'try_files /kam-dashboard/tokens.html =404;' \
  'try_files /kam-dashboard/developer.html =404;' \
  'try_files /kam-dashboard/developer-docs.html =404;' \
  'try_files /kam-dashboard/developer-examples.html =404;' \
  'try_files /kam-dashboard/developer-verify.html =404;' \
  'try_files /kam-dashboard/developer-network.json =404;' \
  'try_files /kam-dashboard/addresses.html =404;' \
  'try_files /kam-dashboard/validators.html =404;' \
  'try_files /kam-dashboard/contracts.html =404;' \
  'try_files /kam-dashboard/status.html =404;'; do
  grep -q "$needle" "$PATCHED_TEMPLATE" || fail "nginx route patch missing: $needle"
done
for needle in \
  'try_files /kam-dashboard/blocks.html =404;' \
  'try_files /kam-dashboard/transactions.html =404;' \
  'try_files /kam-dashboard/api-docs.html =404;'; do
  grep -q "$needle" "$PATCHED_TEMPLATE" || fail "nginx route patch missing: $needle"
done
for needle in \
  'try_files /kam-dashboard/transaction-detail.html =404;' \
  'try_files /kam-dashboard/block-detail.html =404;' \
  'try_files /kam-dashboard/address-detail.html =404;'; do
  grep -q "$needle" "$PATCHED_TEMPLATE" || fail "nginx dynamic route patch missing: $needle"
done
proxy_fs "cat > /target/default.conf.template" < "$PATCHED_TEMPLATE"

rollback(){
  code=$?
  echo "KAM Explorer V2 deployment failed; restoring proxy template." >&2
  proxy_fs "cp -a /target/$BACKUP_NAME /target/default.conf.template" || true
  docker compose up -d --force-recreate proxy >/dev/null 2>&1 || true
  exit "$code"
}
trap rollback ERR
docker compose up -d --force-recreate proxy

fetch_body(){
  local url="$1"
  : > "$VERIFY_BODY"
  curl -fsSL --retry 6 --retry-delay 2 --retry-all-errors --max-time 25 -o "$VERIFY_BODY" "$url"
}
assert_page(){
  local path="$1" marker="$2"
  fetch_body "https://explorer.kriptoaman.com$path"
  grep -Fq "$marker" "$VERIFY_BODY"
}
assert_header(){
  local path="$1" header_re="$2"
  : > "$VERIFY_HEADERS"
  curl -fsSIL --retry 6 --retry-delay 2 --retry-all-errors --max-time 25 -o "$VERIFY_HEADERS" "https://explorer.kriptoaman.com$path"
  grep -Eqi "$header_re" "$VERIFY_HEADERS"
}

assert_page '/' 'data-kam-explorer-version="2.0.0"'
assert_page '/stats' 'data-kam-stats-version="2.0.0"'
! grep -Fq 'Placeholder Counter' "$VERIFY_BODY"
! grep -Eqi 'amount in ETH|>ETH<' "$VERIFY_BODY"
assert_page '/tokens' 'data-kam-tokens-version="2.0.0"'
assert_page '/developer' 'data-kam-developer-version="1.0.0"'
assert_page '/developer/docs' 'data-kam-developer-docs-version="1.0.0"'
assert_page '/developer/examples' 'data-kam-developer-examples-version="1.0.0"'
assert_page '/developer/verify' 'data-kam-developer-verify-version="1.0.0"'
fetch_body 'https://explorer.kriptoaman.com/developer/network.json'
python3 - "$VERIFY_BODY" <<'PY'
import json,sys
with open(sys.argv[1], encoding='utf-8') as fh: d=json.load(fh)
assert d['chainId']==22028 and d['nativeCurrency']['symbol']=='KAM'
assert d['publicDeveloperAccess'] is True
PY
assert_page '/addresses' 'data-kam-addresses-version="1.0.0"'
assert_page '/validators' 'data-kam-validators-version="1.0.0"'
assert_page '/contracts' 'data-kam-contracts-version="1.0.0"'
assert_page '/status' 'data-kam-status-version="1.0.0"'
assert_page '/blocks' 'data-kam-blocks-version="1.0.0"'
assert_page '/txs' 'data-kam-transactions-version="1.0.0"'
assert_page '/api-docs' 'data-kam-api-version="1.0.0"'
! grep -Eq 'http://localhost|127\.0\.0\.1' "$VERIFY_BODY"
assert_header '/' '^x-kam-explorer-version: *2'
assert_header '/stats' '^x-kam-explorer-stats-version: *2'
assert_header '/tokens' '^x-kam-explorer-tokens-version: *2'
assert_header '/developer' '^x-kam-explorer-developer-version: *1'
assert_header '/developer/docs' '^x-kam-developer-docs-version: *1'
assert_header '/developer/examples' '^x-kam-developer-examples-version: *1'
assert_header '/developer/verify' '^x-kam-developer-verify-version: *1'
assert_header '/developer/network.json' '^x-kam-developer-network-version: *1'
assert_header '/addresses' '^x-kam-explorer-addresses-version: *1'
assert_header '/validators' '^x-kam-explorer-validators-version: *1'
assert_header '/contracts' '^x-kam-explorer-contracts-version: *1'
assert_header '/status' '^x-kam-explorer-status-version: *1'
assert_header '/blocks' '^x-kam-explorer-blocks-version: *1'
assert_header '/txs' '^x-kam-explorer-transactions-version: *1'
assert_header '/api-docs' '^x-kam-explorer-api-version: *1'

curl -fsS --retry 4 --retry-all-errors --max-time 15 https://explorer.kriptoaman.com/api/v2/blocks | python3 -c 'import json,sys; d=json.load(sys.stdin); assert d.get("items")'
curl -fsS --retry 4 --retry-all-errors --max-time 15 https://explorer.kriptoaman.com/api/v2/stats | python3 -c 'import json,sys; d=json.load(sys.stdin); assert "total_transactions" in d'
KNOWN_TX="0x9854d90159013d488190d0f1847596a5dfb7582812f880102f167a1b172b163a"
CANONICAL_WKAM="0x0d8848CE88BB09a81a4248Efdd574d50B98b544A"
curl -L -fsS --retry 4 --retry-all-errors --max-time 20 "https://explorer.kriptoaman.com/tx/$KNOWN_TX" -o /dev/null
assert_page "/tx/$KNOWN_TX" 'data-kam-transaction-detail-version="1.0.0"'
assert_page '/block/524248' 'data-kam-block-detail-version="1.0.0"'
assert_page '/address/0x223762E5544063dd740D6E0a6EfD25C3e2D081B3' 'data-kam-address-detail-version="1.0.0"'
curl -L -fsS --retry 4 --retry-all-errors --max-time 20 "https://explorer.kriptoaman.com/token/$CANONICAL_WKAM" -o /dev/null
trap - ERR
echo "KAM Explorer and Developer Ecosystem public surfaces deployed successfully."
echo "backup=$PROXY_DIR/$BACKUP_NAME"
