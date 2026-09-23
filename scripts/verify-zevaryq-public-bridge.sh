#!/usr/bin/env bash
# Post-cutover proof for the existing, isolated ZEVARYQ public Worker route.
# Never changes DNS, Cloudflare routes, RPC, validator, or Blockscout state.
set -uo pipefail
attempts=14
delay_seconds=5
successful_rounds=0

homepage() {
  local label="$1" url="$2" headers body http version logo globe legacy worker cache
  headers="$(mktemp)"; body="$(mktemp)"
  http="$(curl -LsS --connect-timeout 5 --max-time 12 \
    -D "$headers" -o "$body" -w '%{http_code}' \
    -H 'Cache-Control: no-cache' "$url" || true)"
  version="$(grep -o 'data-zevaryq-explorer-version="[^"]*"' "$body" | head -1 || true)"
  logo=0; globe=0; legacy=0; worker=0; cache=0
  grep -Fq 'class="logo logo-zvq"' "$body" && logo=1
  grep -Fq 'class="earth-brandmark"' "$body" && globe=1
  grep -Fq 'class="earth-logo"' "$body" && legacy=1
  grep -iq '^x-zevaryq-explorer-release:[[:space:]]*1\.1\.1' "$headers" && worker=1
  grep -iq '^cache-control:[[:space:]]*no-store' "$headers" && cache=1
  printf '%s http=%s version=%s zvq_header=%s zvq_globe=%s legacy_image=%s new_worker=%s no_store=%s\n' \
    "$label" "$http" "$version" "$logo" "$globe" "$legacy" "$worker" "$cache"
  grep -iE '^(cf-ray|cf-cache-status|cache-control|x-zevaryq-explorer-release):' "$headers" || true
  rm -f "$headers" "$body"
  [[ "$http" == 200 && "$version" == 'data-zevaryq-explorer-version="1.1.1"' \
     && "$logo" == 1 && "$globe" == 1 && "$legacy" == 0 \
     && "$worker" == 1 && "$cache" == 1 ]]
}

preserved_routes() {
  local rpc blocks tmp code
  tmp="$(mktemp)"
  code="$(curl -sS --connect-timeout 5 --max-time 15 \
    -o "$tmp" -w '%{http_code}' \
    -H 'content-type: application/json' \
    --data '{"jsonrpc":"2.0","id":9,"method":"eth_chainId","params":[]}' \
    'https://explorer.kriptoaman.com/rpc' || true)"
  if [[ "$code" != 200 ]] || ! jq -e '.result == "0x560c"' "$tmp" >/dev/null 2>&1; then
    echo "preserved_rpc=FAIL http=$code"; rm -f "$tmp"; return 1
  fi
  echo 'preserved_rpc=0x560c'
  code="$(curl -sS --connect-timeout 5 --max-time 15 \
    -o "$tmp" -w '%{http_code}' \
    'https://explorer.kriptoaman.com/api/v2/blocks' || true)"
  if [[ "$code" != 200 ]] || ! jq -e '(.items | type == "array") and (.items | length > 0)' "$tmp" >/dev/null 2>&1; then
    echo "preserved_indexer=FAIL http=$code"; rm -f "$tmp"; return 1
  fi
  echo 'preserved_indexer=verified'
  code="$(curl -LsS --connect-timeout 5 --max-time 12 -o /dev/null -w '%{http_code}' \
    'https://explorer.kriptoaman.com/blocks' || true)"
  if [[ "$code" != 200 ]]; then
    echo "preserved_blocks_page=FAIL http=$code"; rm -f "$tmp"; return 1
  fi
  echo 'preserved_blocks_page=200'
  rm -f "$tmp"
}

for ((attempt=1;attempt<=attempts;attempt++)); do
  echo "bridge_public_attempt=$attempt/$attempts"
  if homepage default 'https://explorer.kriptoaman.com/' \
    && homepage bypass "https://explorer.kriptoaman.com/?zvq_release=1.1.1-$GITHUB_RUN_ID-$attempt" \
    && preserved_routes; then
    successful_rounds=$((successful_rounds + 1))
    echo "verified_consecutive_rounds=$successful_rounds"
    if ((successful_rounds >= 2)); then
      echo 'PUBLIC_ZVQ_BRIDGE_VERIFIED=1'
      exit 0
    fi
  else
    successful_rounds=0
    echo "::warning::Public release propagation or a preserved route is not verified (attempt $attempt)."
  fi
  if ((attempt < attempts)); then sleep "$delay_seconds"; fi
done
echo '::error::Public ZVQ bridge never passed two consecutive default/bypass/RPC/API/blocks checks. Caller must restore prior route.'
exit 1
