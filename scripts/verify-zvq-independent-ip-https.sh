#!/usr/bin/env bash
set -Eeuo pipefail
IP='146.190.93.254'
base="https://$IP"
body="$(mktemp)"; headers="$(mktemp)"
trap 'rm -f "$body" "$headers"' EXIT
code="$(curl --noproxy '*' -LsS --retry 2 --connect-timeout 7 --max-time 22 \
  -D "$headers" -o "$body" -w '%{http_code}' "$base/")"
test "$code" = 200
grep -Fq 'data-zvq-reference-visual="blue-gold-orbital-20260924"' "$body"
grep -Fq 'data-zvq-token-discovery="indexed-v2"' "$body"
grep -iq '^x-zvq-independent-origin: trusted-ip-v1' "$headers"
echo "direct_ip_https=http_$code orbital_ui=verified indexed_token_discovery=verified"
asset="$(curl --noproxy '*' -LsS --connect-timeout 7 --max-time 15 \
  -o /dev/null -w '%{http_code}' "$base/zevaryq-assets/zevaryq-emblem.webp")"
test "$asset" = 200
chain="$(curl --noproxy '*' -fsS --connect-timeout 7 --max-time 20 \
  -H 'content-type: application/json' \
  --data '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}' \
  "$base/rpc" | jq -r '.result // empty')"
test "$chain" = 0x560c
blocks="$(curl --noproxy '*' -fsS --connect-timeout 7 --max-time 20 \
  "$base/api/v2/blocks")"
jq -e '(.items | type == "array") and (.items | length > 0)' <<<"$blocks" >/dev/null
tip="$(jq -r '.items[0].height // "unavailable"' <<<"$blocks")"
admin="$(curl --noproxy '*' -sS --connect-timeout 7 --max-time 20 \
  -H 'content-type: application/json' \
  --data '{"jsonrpc":"2.0","id":2,"method":"qbft_getValidatorsByBlockNumber","params":["latest"]}' \
  -o "$body" -w '%{http_code}' "$base/rpc" || true)"
if [[ "$admin" != 403 ]] && ! jq -e '.result == null and ([ -32601, -32604 ] | index(.error.code)) != null' "$body" >/dev/null 2>&1; then
  echo 'Privileged consensus RPC method is not verifiably blocked' >&2
  exit 1
fi
leaf="$(mktemp)"
trap 'rm -f "$body" "$headers" "$leaf"' EXIT
echo | openssl s_client -connect "$IP:443" 2>/dev/null |
  openssl x509 >"$leaf"
openssl x509 -in "$leaf" -noout -checkend 86400
openssl x509 -in "$leaf" -noout -ext subjectAltName | grep -Fq "IP Address:$IP"
echo "verified_direct_chain=0x560c; indexed_tip=$tip; denied_admin=yes; trusted_ip_tls_expires_gt_24h=yes; brand_asset_http_200=yes"
