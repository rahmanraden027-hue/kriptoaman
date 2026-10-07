#!/usr/bin/env bash
# Repair only the dedicated Explorer's static ZVQ asset URL mapping.
# No RPC, blockchain, DNS, Cloudflare, validator, database or key operations.
set -Eeuo pipefail

BASE=/opt/blockscout/docker-compose
PROXY_DIR="$BASE/proxy"
TEMPLATE="$PROXY_DIR/default.conf.template"
MASTER_SHA=a74790a590757e6f4425d384fdc0cdf40cb8030807eb7c0892ba8aaa4e6fc6cc

render_template() {
  python3 - "$1" "$2" <<'PY'
from pathlib import Path
import re
import sys
src, target = (Path(p) for p in sys.argv[1:3])
text = src.read_text(encoding='utf-8')
if re.search(r'location\s+(?:\^~\s+)?/zevaryq-assets/', text):
    raise SystemExit('Refusing duplicate or unexpected ZVQ assets location')
anchor = r'(?m)^([ \t]*)location\s*=\s*/\s*\{'
matches = list(re.finditer(anchor, text))
if len(matches) != 1:
    raise SystemExit(f'Expected one Explorer homepage location, found {len(matches)}; unchanged')
indent = matches[0].group(1)
unit = '    '
block = '\n'.join([
    indent + 'location ^~ /zevaryq-assets/ {',
    indent + unit + 'limit_except GET { deny all; }',
    indent + unit + 'root /etc/nginx/templates/kam-dashboard;',
    indent + unit + 'types { image/webp webp; image/png png; image/svg+xml svg; }',
    indent + unit + 'default_type application/octet-stream;',
    indent + unit + 'add_header Cache-Control "public, max-age=300" always;',
    indent + unit + 'add_header X-Content-Type-Options "nosniff" always;',
    indent + unit + 'try_files $uri =404;',
    indent + '}',
    '',
])
result = text[:matches[0].start()] + block + text[matches[0].start():]
assert result.replace(block, '', 1) == text, 'Unexpected template changes'
target.write_text(result, encoding='utf-8')
print('static_asset_route=rendered; anchor=one; original_template_preserved')
PY
}

# Safe deterministic test mode: no Docker, privileged paths or network access.
if [[ "${1:-}" == '--render-only' ]]; then
  [[ "$#" -eq 3 ]] || { echo 'Usage: --render-only SOURCE DESTINATION' >&2; exit 2; }
  render_template "$2" "$3"
  exit 0
fi
[[ "$#" -eq 0 ]] || { echo 'Unexpected arguments' >&2; exit 2; }
[[ "$(id -u)" -eq 0 ]] || { echo 'Run as root on the existing Explorer host' >&2; exit 1; }
[[ -f "$TEMPLATE" && -d "$PROXY_DIR/kam-dashboard/zevaryq-assets" ]] || { echo 'Dedicated Explorer origin missing' >&2; exit 1; }
[[ -f "$PROXY_DIR/kam-dashboard/index.html" ]] || { echo 'Production homepage missing' >&2; exit 1; }
grep -Fq "EXPECTED_CHAIN='0x560c'" "$PROXY_DIR/kam-dashboard/index.html" || { echo 'Wrong chain or page; refusing repair' >&2; exit 1; }
grep -Fq 'data-zvq-official-logo="20261008-zevaryq-identity-v2"' "$PROXY_DIR/kam-dashboard/index.html" || { echo 'Official logo release not deployed' >&2; exit 1; }
[[ "$(sha256sum "$PROXY_DIR/kam-dashboard/zevaryq-assets/zevaryq-master-v2.svg" | cut -d' ' -f1)" == "$MASTER_SHA" ]] || { echo 'Approved Identity V2 master mark not present on host' >&2; exit 1; }
cd "$BASE"
[[ -n "$(docker compose ps -q proxy)" ]] || { echo 'Existing proxy unavailable; no changes' >&2; exit 1; }
docker compose config -q

# Idempotent success is permitted only when the live origin serves the exact Identity V2 master asset.
if grep -Fq 'location ^~ /zevaryq-assets/' "$TEMPLATE"; then
  tmp_check="$(mktemp -d)"
  trap 'rm -rf "$tmp_check"' EXIT
  curl --noproxy '*' -fsS --max-time 10 http://127.0.0.1/zevaryq-assets/zevaryq-master-v2.svg -o "$tmp_check/zevaryq-master-v2.svg"
  [[ "$(sha256sum "$tmp_check/zevaryq-master-v2.svg" | cut -d' ' -f1)" == "$MASTER_SHA" ]] || { echo 'Existing route does not serve correct Identity V2 master mark; manual investigation required' >&2; exit 1; }
  echo 'static_asset_route=already_healthy; identity_v2_sha256=verified'
  exit 0
fi

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP="$TEMPLATE.zvq-asset-route.$STAMP.bak"
CANDIDATE="$(mktemp "$PROXY_DIR/.zvq-asset-route.XXXXXXXX")"
CHECK_DIR="$(mktemp -d)"
backup_created=no
cleanup() { rm -f "$CANDIDATE"; rm -rf "$CHECK_DIR"; }
rollback() {
  code=$?
  trap - ERR
  if [[ "$backup_created" == yes ]]; then
    cp -a "$BACKUP" "$TEMPLATE" || true
    (cd "$BASE" && docker compose up -d --no-deps --force-recreate proxy) || true
    echo "static_asset_route=rolled_back; original_template=$BACKUP" >&2
  fi
  exit "$code"
}
trap cleanup EXIT
trap rollback ERR

render_template "$TEMPLATE" "$CANDIDATE"
cp -a "$TEMPLATE" "$BACKUP"
backup_created=yes
install -m 0644 "$CANDIDATE" "$TEMPLATE"
# Only recreate the existing Explorer proxy. Other containers and chain state stay untouched.
docker compose config -q
docker compose up -d --no-deps --force-recreate proxy
entry='zevaryq-master-v2.svg'
curl --noproxy '*' -fLsS --retry 7 --retry-delay 1 --retry-all-errors --connect-timeout 3 --max-time 18 "http://127.0.0.1/zevaryq-assets/$entry?v=20261008-zevaryq-identity-v2" -o "$CHECK_DIR/$entry"
actual="$(sha256sum "$CHECK_DIR/$entry" | cut -d' ' -f1)"
[[ "$actual" == "$MASTER_SHA" ]] || { echo "static asset mismatch: $entry; got $actual; reverting" >&2; false; }
echo "local_asset_verified=$entry sha256=$actual"
curl --noproxy '*' -fLsS --retry 5 --retry-delay 1 --retry-all-errors --max-time 16 http://127.0.0.1/ -o "$CHECK_DIR/index.html"
grep -Fq 'data-zvq-official-logo="20261008-zevaryq-identity-v2"' "$CHECK_DIR/index.html"
grep -Fq "EXPECTED_CHAIN='0x560c'" "$CHECK_DIR/index.html"
docker compose exec -T proxy nginx -t
trap - ERR
echo "static_asset_route=healthy; backup=$BACKUP; only_proxy_recreated=true"