#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

D=/opt/blockscout/docker-compose/proxy/kam-dashboard
TEMPLATE=/opt/blockscout/docker-compose/proxy/default.conf.template
BACKUPS=/var/backups/kriptoaman/zvq-explorer-identity-drift
DOMAIN=https://explorer.kriptoaman.com
FILES="api-docs.html validators.html"
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
BACKUP=
MODIFIED=0
SUCCESS=0

fail(){ echo "ZVQ identity drift repair: $*" >&2; exit 1; }
sha(){ sha256sum "$1" | awk '{print $1}'; }
atomic_from(){ src=$1; dst=$2; tmp=$(mktemp "$D/.zvq-identity.XXXXXXXX"); cp -p -- "$src" "$tmp"; chmod 0644 "$tmp"; mv -fT -- "$tmp" "$dst"; }

restore(){
  test -n "$BACKUP" || fail "rollback folder not selected"
  test -d "$BACKUP" && test ! -L "$BACKUP" || fail "rollback folder missing"
  test "$(sha "$D/index.html")" = "$(cat "$BACKUP/index.sha")" || fail "homepage changed; refuse rollback"
  test "$(sha "$D/blocks.html")" = "$(cat "$BACKUP/blocks.sha")" || fail "blocks changed; refuse rollback"
  test "$(sha "$D/transactions.html")" = "$(cat "$BACKUP/transactions.sha")" || fail "transactions changed; refuse rollback"
  test "$(sha "$TEMPLATE")" = "$(cat "$BACKUP/template.sha")" || fail "nginx template changed; refuse rollback"
  for file in $FILES; do
    current=
    test ! -f "$D/$file" || current=$(sha "$D/$file")
    new=$(cat "$BACKUP/$file.newsha")
    if test -f "$BACKUP/$file.before"; then
      old=$(sha "$BACKUP/$file.before")
      test "$current" = "$old" || test "$current" = "$new" || fail "unexpected concurrent edit: $file"
      atomic_from "$BACKUP/$file.before" "$D/$file"
    else
      test -f "$BACKUP/$file.absent" || fail "backup state missing: $file"
      test "$current" = "$new" || fail "unexpected concurrent edit: $file"
      rm -f -- "$D/$file"
    fi
  done
  echo "ZVQ_IDENTITY_ROLLBACK=completed"
}

finish(){
  rc=$?
  trap - EXIT
  if test "$MODIFIED" = 1 && test "$SUCCESS" != 1; then
    echo "ZVQ identity drift repair: gate failed; rolling back exact two files" >&2
    restore || true
  fi
  exit "$rc"
}
trap finish EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

test "$EUID" = 0 || fail "run with sudo on dedicated Explorer host"
test "$(hostname -s)" = "kam-explorer-blockscout-01" || fail "wrong host"
test -d "$D" && test ! -L "$D" || fail "protected dashboard mount missing"
test -f "$TEMPLATE" && test ! -L "$TEMPLATE" || fail "protected nginx template missing"
for sentinel in index.html blocks.html transactions.html; do test -f "$D/$sentinel" && test ! -L "$D/$sentinel" || fail "missing sentinel: $sentinel"; done
grep -Fq 'data-zevaryq-explorer-version' "$D/index.html" || fail "ZEVARYQ homepage identity missing"

if test "$#" -ge 1 && test "$1" = --rollback; then
  test "$#" = 2 || fail "usage: --rollback YYYYMMDDTHHMMSSZ"
  printf '%s' "$2" | grep -Eq '^[0-9]{8}T[0-9]{6}Z$' || fail "invalid rollback stamp"
  BACKUP="$BACKUPS/$2"
  restore
  SUCCESS=1
  exit 0
fi
test "$#" = 0 || fail "unexpected arguments"

SOURCE_DIR=$(realpath explorer-dashboard)
for file in $FILES; do
  test -f "$SOURCE_DIR/$file" && test ! -L "$SOURCE_DIR/$file" || fail "source missing: $file"
  grep -Fq 'ZEVARYQ' "$SOURCE_DIR/$file" || fail "ZEVARYQ marker missing: $file"
  ! grep -Eq 'KAM NETWORK|<strong>KAM Explorer</strong>|API · KAM Explorer' "$SOURCE_DIR/$file" || fail "legacy visible branding remains in source: $file"
done
grep -Fq 'data-kam-api-version="1.0.0"' "$SOURCE_DIR/api-docs.html" || fail "api marker missing"
grep -Fq 'data-kam-validators-version="1.0.0"' "$SOURCE_DIR/validators.html" || fail "validators marker missing"
grep -Fq 'location = /api-docs' "$TEMPLATE" || fail "api-docs route missing"
grep -Fq 'try_files /kam-dashboard/api-docs.html =404' "$TEMPLATE" || fail "api-docs mapping changed"
grep -Fq 'location = /validators' "$TEMPLATE" || fail "validators route missing"
grep -Fq 'try_files /kam-dashboard/validators.html =404' "$TEMPLATE" || fail "validators mapping changed"

public_read_gate(){
  curl -fsS --connect-timeout 8 --max-time 22 "$DOMAIN/" -o /tmp/zvq-root.html
  grep -Fq 'data-zevaryq-explorer-version' /tmp/zvq-root.html
  for route in blocks txs; do
    curl -fsS --connect-timeout 8 --max-time 22 "$DOMAIN/$route?identity_gate=$STAMP" -o "/tmp/zvq-$route.html"
    grep -Fq 'ZEVARYQ Explorer' "/tmp/zvq-$route.html"
  done
  chain=$(curl -fsS --connect-timeout 8 --max-time 18 -H 'Content-Type: application/json' --data '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}' "$DOMAIN/rpc")
  test "$(printf '%s' "$chain" | jq -r '.result // empty')" = 0x560c || fail "browser RPC chain mismatch"
  curl -fsS --connect-timeout 8 --max-time 18 "$DOMAIN/api/v2/blocks" | jq -e '(.items | type == "array") and (.items | length > 0)' >/dev/null || fail "block indexer unavailable"
  for method in eth_sendRawTransaction admin_peers; do
    status=$(curl -sS --connect-timeout 8 --max-time 18 -o /dev/null -w '%{http_code}' -H 'Content-Type: application/json' --data "{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"$method\",\"params\":[]}" "$DOMAIN/rpc")
    test "$status" = 403 || fail "privileged/write RPC method not denied: $method ($status)"
  done
}
public_read_gate

ROOT_SHA=$(sha "$D/index.html")
BLOCKS_SHA=$(sha "$D/blocks.html")
TXS_SHA=$(sha "$D/transactions.html")
TEMPLATE_SHA=$(sha "$TEMPLATE")

if cmp -s "$D/api-docs.html" "$SOURCE_DIR/api-docs.html" 2>/dev/null && cmp -s "$D/validators.html" "$SOURCE_DIR/validators.html" 2>/dev/null; then
  echo "ZVQ_IDENTITY_ALREADY_CURRENT=1"
  SUCCESS=1
  exit 0
fi

mkdir -p -m 0700 "$BACKUPS"
BACKUP="$BACKUPS/$STAMP"
test ! -e "$BACKUP" || fail "backup stamp collision"
mkdir -m 0700 "$BACKUP"
printf '%s\n' "$ROOT_SHA" > "$BACKUP/index.sha"
printf '%s\n' "$BLOCKS_SHA" > "$BACKUP/blocks.sha"
printf '%s\n' "$TXS_SHA" > "$BACKUP/transactions.sha"
printf '%s\n' "$TEMPLATE_SHA" > "$BACKUP/template.sha"

for file in $FILES; do
  if test -f "$D/$file" && test ! -L "$D/$file"; then cp -p -- "$D/$file" "$BACKUP/$file.before"; else : > "$BACKUP/$file.absent"; fi
  sha "$SOURCE_DIR/$file" > "$BACKUP/$file.newsha"
done

MODIFIED=1
atomic_from "$SOURCE_DIR/api-docs.html" "$D/api-docs.html"
atomic_from "$SOURCE_DIR/validators.html" "$D/validators.html"

test "$(sha "$D/index.html")" = "$ROOT_SHA" || fail "homepage hash drift"
test "$(sha "$D/blocks.html")" = "$BLOCKS_SHA" || fail "blocks hash drift"
test "$(sha "$D/transactions.html")" = "$TXS_SHA" || fail "transactions hash drift"
test "$(sha "$TEMPLATE")" = "$TEMPLATE_SHA" || fail "nginx template hash drift"
for file in $FILES; do test "$(sha "$D/$file")" = "$(cat "$BACKUP/$file.newsha")" || fail "deployed hash mismatch: $file"; done

curl -fsS --connect-timeout 8 --max-time 22 -H 'Cache-Control: no-cache' "$DOMAIN/api-docs?identity_after=$STAMP" -o /tmp/zvq-api-after.html
grep -Fq 'data-kam-api-version="1.0.0"' /tmp/zvq-api-after.html
grep -Fq 'API · ZVQ Explorer' /tmp/zvq-api-after.html
grep -Fq 'ZEVARYQ Mainnet' /tmp/zvq-api-after.html
! grep -Eq 'KAM NETWORK|API · KAM Explorer|<strong>KAM Explorer</strong>' /tmp/zvq-api-after.html

curl -fsS --connect-timeout 8 --max-time 22 -H 'Cache-Control: no-cache' "$DOMAIN/validators?identity_after=$STAMP" -o /tmp/zvq-validators-after.html
grep -Fq 'data-kam-validators-version="1.0.0"' /tmp/zvq-validators-after.html
grep -Fq 'ZVQ Proposer Observatory' /tmp/zvq-validators-after.html
grep -Fq 'ZEVARYQ Mainnet' /tmp/zvq-validators-after.html
! grep -Eq 'KAM NETWORK|<strong>KAM Explorer</strong>' /tmp/zvq-validators-after.html

public_read_gate
SUCCESS=1
echo "ZVQ_IDENTITY_DEPLOY_STAMP=$STAMP"
echo "ZVQ_IDENTITY_DEPLOY=api-docs.html,validators.html sentinels_unchanged=yes nginx_unchanged=yes rollback=retained"
