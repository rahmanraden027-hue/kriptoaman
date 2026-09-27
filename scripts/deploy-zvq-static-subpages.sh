#!/usr/bin/env bash
# Restricted production rollout of reviewed ZVQ /blocks and /txs static HTML only.
set -Eeuo pipefail
umask 077
D=/opt/blockscout/docker-compose/proxy/kam-dashboard
TEMPLATE=/opt/blockscout/docker-compose/proxy/default.conf.template
BACKUPS=/var/backups/kriptoaman/zvq-static-subpages
DOMAIN=https://explorer.kriptoaman.com
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
TMP=''; BACKUP=''; MODIFIED=0; SUCCESS=0
fail() { echo "ZVQ subpages: $*" >&2; exit 1; }
sha() { sha256sum "$1" | cut -d ' ' -f 1; }
atomic_from() {
  local src="$1" dst="$2" temp
  temp=$(mktemp "$D/.zvq-atomic.XXXXXXXX")
  cp -p -- "$src" "$temp"
  mv -fT -- "$temp" "$dst"
}
restore() {
  [[ -d "$BACKUP" && ! -L "$BACKUP" ]] || fail 'Protected rollback folder missing'
  [[ "$(sha "$D/index.html")" == "$(cat "$BACKUP/root.sha")" ]] || fail 'Homepage changed; refuse rollback'
  local file current old new
  for file in blocks.html transactions.html; do
    [[ -f "$BACKUP/$file.before" && ! -L "$BACKUP/$file.before" ]] || fail "Backup missing: $file"
    current=$(sha "$D/$file")
    old=$(sha "$BACKUP/$file.before")
    new=$(cat "$BACKUP/$file.newsha")
    [[ "$current" == "$old" || "$current" == "$new" ]] || fail "Unexpected external edit: $file"
  done
  for file in blocks.html transactions.html; do
    atomic_from "$BACKUP/$file.before" "$D/$file"
  done
  echo 'ZVQ_SUBPAGES_ROLLBACK=completed'
}
finish() {
  local status=$?
  trap - EXIT
  if [[ "$MODIFIED" == 1 && "$SUCCESS" != 1 ]]; then
    echo 'ZVQ subpages: gate failed; attempt exact-page rollback' >&2
    restore || true
  fi
  [[ -z "$TMP" ]] || rm -rf -- "$TMP"
  exit "$status"
}
trap finish EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
[[ "$EUID" == 0 ]] || fail 'Run with sudo on the dedicated Explorer host'
[[ "$(hostname -s)" == 'kam-explorer-blockscout-01' ]] || fail 'Wrong host'
[[ -d "$D" && ! -L "$D" && -f "$TEMPLATE" && ! -L "$TEMPLATE" ]] || fail 'Missing protected proxy mount'
[[ -f "$D/index.html" && ! -L "$D/index.html" ]] || fail 'Missing protected homepage'
grep -Fq 'data-zevaryq-explorer-version' "$D/index.html" || fail 'Protected homepage identity missing'
if [[ $# -ge 1 && "$1" == --rollback ]]; then
  [[ $# == 2 && "$2" =~ ^[0-9]{8}T[0-9]{6}Z$ ]] || fail 'Invalid rollback stamp'
  BACKUP="$BACKUPS/$2"
  restore
  SUCCESS=1
  exit 0
fi
[[ $# == 0 ]] || fail 'Usage: deploy-zvq-static-subpages.sh [--rollback YYYYMMDDTHHMMSSZ]'
SOURCE_DIR=$(realpath explorer-dashboard)
for file in blocks.html transactions.html; do
  [[ -f "$SOURCE_DIR/$file" && ! -L "$SOURCE_DIR/$file" ]] || fail "Source absent: $file"
  [[ -f "$D/$file" && ! -L "$D/$file" ]] || fail "Destination absent: $file"
  grep -Fq 'data-zvq-public-brand="1.0.0"' "$SOURCE_DIR/$file" || fail "New marker absent: $file"
  grep -Fq 'ZEVARYQ Explorer' "$SOURCE_DIR/$file" || fail "New branding absent: $file"
  ! grep -Eq 'KAM NETWORK|<strong>KAM Explorer</strong>' "$SOURCE_DIR/$file" || fail "Old visible brand present in source: $file"
done
# Reject routing drift; never edit or restart NGINX or replace the ZVQ homepage.
for route in /blocks /txs; do
  grep -Fq "location = $route" "$TEMPLATE" || fail "Exact route missing: $route"
done
grep -Fq 'try_files /kam-dashboard/blocks.html =404' "$TEMPLATE" || fail 'Unexpected blocks mapping'
grep -Fq 'try_files /kam-dashboard/transactions.html =404' "$TEMPLATE" || fail 'Unexpected txs mapping'
ROOT_BEFORE=$(sha "$D/index.html")
TMP=$(mktemp -d)
fetch_page() {
  curl -fsSL --retry 1 --connect-timeout 6 --max-time 18 -H 'Cache-Control: no-cache' \
    "$DOMAIN/$1?zvq_route_proof=$STAMP-$3" -o "$2"
}
verify_chain_and_indexer() {
  local response
  response=$(curl -fsS --connect-timeout 6 --max-time 15 -H 'Content-Type: application/json' \
    --data '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}' "$DOMAIN/rpc")
  jq -e '.result == "0x560c"' <<<"$response" >/dev/null || fail 'Read-only RPC chain mismatch'
  curl -fsS --connect-timeout 6 --max-time 15 "$DOMAIN/api/v2/blocks" \
    | jq -e '(.items | type == "array") and (.items | length > 0)' >/dev/null || fail 'Indexer unavailable'
}
verify_chain_and_indexer
fetch_page blocks "$TMP/blocks.before" before
fetch_page txs "$TMP/txs.before" before
cmp -s "$TMP/blocks.before" "$D/blocks.html" || fail '/blocks does not map to protected mounted file'
cmp -s "$TMP/txs.before" "$D/transactions.html" || fail '/txs does not map to protected mounted file'
if cmp -s "$D/blocks.html" "$SOURCE_DIR/blocks.html" && cmp -s "$D/transactions.html" "$SOURCE_DIR/transactions.html"; then
  echo 'ZVQ_SUBPAGES_ALREADY_CURRENT=1'; SUCCESS=1; exit 0
fi
mkdir -p -m 0700 "$BACKUPS"
BACKUP="$BACKUPS/$STAMP"
[[ ! -e "$BACKUP" ]] || fail 'Rollback stamp collision'
mkdir -m 0700 "$BACKUP"
printf '%s\n' "$ROOT_BEFORE" > "$BACKUP/root.sha"
for file in blocks.html transactions.html; do
  cp -p -- "$D/$file" "$BACKUP/$file.before"
  cp -p -- "$D/$file" "$BACKUP/$file.second-copy"
  sha "$SOURCE_DIR/$file" > "$BACKUP/$file.newsha"
done
MODIFIED=1
atomic_from "$SOURCE_DIR/blocks.html" "$D/blocks.html"
atomic_from "$SOURCE_DIR/transactions.html" "$D/transactions.html"
[[ "$(sha "$D/index.html")" == "$ROOT_BEFORE" ]] || fail 'Protected homepage changed'
for file in blocks.html transactions.html; do
  [[ "$(sha "$D/$file")" == "$(cat "$BACKUP/$file.newsha")" ]] || fail "New file hash mismatch: $file"
done
fetch_page blocks "$TMP/blocks.after" after
fetch_page txs "$TMP/txs.after" after
for path in blocks txs; do
  grep -Fq 'data-zvq-public-brand="1.0.0"' "$TMP/$path.after" || fail "Public marker absent: $path"
  grep -Fq 'ZEVARYQ Explorer' "$TMP/$path.after" || fail "Public branding absent: $path"
  ! grep -Eq 'KAM NETWORK|<strong>KAM Explorer</strong>' "$TMP/$path.after" || fail "Public KAM branding remains: $path"
done
verify_chain_and_indexer
[[ "$(sha "$D/index.html")" == "$ROOT_BEFORE" ]] || fail 'Homepage hash drift'
SUCCESS=1
echo "ZVQ_SUBPAGES_DEPLOY_STAMP=$STAMP"
echo 'ZVQ_SUBPAGES_PUBLIC=2/2 chain=22028 indexer=present homepage=unchanged rollback=retained'
