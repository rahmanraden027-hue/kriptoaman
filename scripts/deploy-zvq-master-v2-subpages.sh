#!/usr/bin/env bash
# Exact-file guarded ZEVARYQ V2 subpage rollout; never touches homepage or node.
set -Eeuo pipefail
umask 077
D=/opt/blockscout/docker-compose/proxy/kam-dashboard
TEMPLATE=/opt/blockscout/docker-compose/proxy/default.conf.template
BACKUPS=/var/backups/kriptoaman/zvq-master-v2-routes
DOMAIN=https://explorer.kriptoaman.com
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
FILES=(address-detail.html addresses.html api-docs.html block-detail.html blocks.html contracts.html developer-docs.html developer-examples.html developer-starter.html developer-verify.html developer.html stats.html status.html tokens.html transaction-detail.html transactions.html validators.html)
BACKUP='' MODIFIED=0 SUCCESS=0
fail(){ echo "ZVQ Master V2 routes: $*" >&2; exit 1; }
sha(){ sha256sum "$1" | cut -d ' ' -f 1; }
atomic_from(){ local tmp; tmp=$(mktemp "$D/.zvq-master-v2.XXXXXXXX"); cp -p -- "$1" "$tmp"; mv -fT -- "$tmp" "$2"; }
restore(){
  [[ -d "$BACKUP" && ! -L "$BACKUP" ]] || fail 'Protected backup missing'
  [[ "$(sha "$D/index.html")" == "$(cat "$BACKUP/root.sha")" ]] || fail 'Homepage drift'
  local f old new current
  for f in "${FILES[@]}"; do
    [[ -f "$BACKUP/$f.before" && ! -L "$BACKUP/$f.before" ]] || fail "Backup missing: $f"
    old=$(sha "$BACKUP/$f.before"); new=$(cat "$BACKUP/$f.newsha"); current=$(sha "$D/$f")
    [[ "$current" == "$old" || "$current" == "$new" ]] || fail "External file edit: $f"
  done
  for f in "${FILES[@]}"; do atomic_from "$BACKUP/$f.before" "$D/$f"; done
  echo 'ZVQ_MASTER_V2_ROLLBACK=completed'
}
finish(){
  local status=$?; trap - EXIT
  if [[ "$MODIFIED" == 1 && "$SUCCESS" != 1 ]]; then restore || echo 'MANUAL_ROLLBACK_REQUIRED' >&2; fi
  exit "$status"
}
trap finish EXIT
[[ "$EUID" == 0 ]] || fail 'Requires sudo'
[[ "$(hostname -s)" == kam-explorer-blockscout-01 ]] || fail 'Wrong dedicated host'
[[ -d "$D" && ! -L "$D" && -f "$TEMPLATE" && ! -L "$TEMPLATE" ]] || fail 'Missing protected mount'
[[ -f "$D/index.html" && ! -L "$D/index.html" ]] || fail 'Missing protected homepage'
grep -Fq 'data-zevaryq-explorer-version' "$D/index.html" || fail 'Protected homepage marker missing'
if [[ "${1:-}" == --rollback ]]; then
  [[ $# == 2 && "$2" =~ ^[0-9]{8}T[0-9]{6}Z$ ]] || fail 'Rollback stamp invalid'
  BACKUP="$BACKUPS/$2"; restore; SUCCESS=1; exit 0
fi
[[ $# == 0 ]] || fail 'Usage: deploy-zvq-master-v2-subpages.sh [--rollback YYYYMMDDTHHMMSSZ]'
SOURCE_DIR=$(realpath explorer-dashboard)
MASTER='/zevaryq-assets/zevaryq-master-v2.svg?v=20261008-zevaryq-identity-v2'
for f in "${FILES[@]}"; do
  [[ -f "$SOURCE_DIR/$f" && ! -L "$SOURCE_DIR/$f" && -f "$D/$f" && ! -L "$D/$f" ]] || fail "Missing exact file: $f"
  grep -Fq "$MASTER" "$SOURCE_DIR/$f" || fail "Master mark missing: $f"
  grep -Fq 'rel="icon"' "$SOURCE_DIR/$f" || fail "Favicon missing: $f"
  ! grep -Eq '<div class="mark">K</div>|https://kriptoaman.com/brand/(zevaryq|kriptoaman)-mark.svg' "$SOURCE_DIR/$f" || fail "Legacy image: $f"
done
ROOT_BEFORE=$(sha "$D/index.html")
curl -fsS --connect-timeout 7 --max-time 20 "$DOMAIN/zevaryq-assets/zevaryq-master-v2.svg?v=20261008-zevaryq-identity-v2" -o /dev/null || fail 'Approved public SVG not accessible'
chain=$(curl -fsS --connect-timeout 7 --max-time 18 -H 'Content-Type: application/json' --data '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}' "$DOMAIN/rpc")
jq -e '.result == "0x560c"' <<<"$chain" >/dev/null || fail 'Unexpected chain ID'
curl -fsS --connect-timeout 7 --max-time 18 "$DOMAIN/api/v2/blocks" | jq -e '(.items | type == "array") and (.items | length > 0)' >/dev/null || fail 'Missing indexed blocks'
current=0
for f in "${FILES[@]}"; do if cmp -s "$D/$f" "$SOURCE_DIR/$f"; then current=$((current+1)); fi; done
if [[ "$current" == "${#FILES[@]}" ]]; then echo 'ZVQ_MASTER_V2_ALREADY_CURRENT=17'; SUCCESS=1; exit 0; fi
mkdir -p -m 0700 "$BACKUPS"; BACKUP="$BACKUPS/$STAMP"
[[ ! -e "$BACKUP" ]] || fail 'Backup collision'
mkdir -m 0700 "$BACKUP"
printf '%s\n' "$ROOT_BEFORE" > "$BACKUP/root.sha"
for f in "${FILES[@]}"; do
  cp -p -- "$D/$f" "$BACKUP/$f.before"
  cp -p -- "$D/$f" "$BACKUP/$f.second-copy"
  sha "$SOURCE_DIR/$f" > "$BACKUP/$f.newsha"
done
MODIFIED=1
for f in "${FILES[@]}"; do atomic_from "$SOURCE_DIR/$f" "$D/$f"; done
[[ "$(sha "$D/index.html")" == "$ROOT_BEFORE" ]] || fail 'Homepage changed'
for f in "${FILES[@]}"; do
  [[ "$(sha "$D/$f")" == "$(cat "$BACKUP/$f.newsha")" ]] || fail "Installed file mismatch: $f"
done
SUCCESS=1
echo "ZVQ_MASTER_V2_SUBPAGES_DEPLOY_STAMP=$STAMP"
echo 'ZVQ_MASTER_V2_SUBPAGES_FILES=17 root=unchanged hash=verified'
