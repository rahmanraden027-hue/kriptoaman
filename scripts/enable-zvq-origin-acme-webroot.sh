#!/usr/bin/env bash
set -Eeuo pipefail
BASE='/opt/blockscout/docker-compose'
ROOT="$BASE/proxy/kam-dashboard"
TEMPLATE="$BASE/proxy/default.conf.template"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP="$TEMPLATE.zvq-acme-$STAMP.bak"
TOKEN="zvq-acme-proof-$GITHUB_RUN_ID"
FILE="$ROOT/.well-known/acme-challenge/$TOKEN"
CONTENT="zvq-acme-origin-proof-$GITHUB_RUN_ID"
CHANGED=false

fail(){ echo "ZVQ ACME origin: $*" >&2; exit 1; }
rollback(){
  code=$?
  trap - ERR
  if [[ "$CHANGED" == true && -s "$BACKUP" ]]; then
    cp -a "$BACKUP" "$TEMPLATE" || true
    (cd "$BASE" && docker compose up -d --force-recreate proxy) || true
  fi
  rm -f "$FILE" || true
  echo "origin_acme_rollout=rolled_back exit=$code backup_retained=$BACKUP" >&2
  exit "$code"
}
trap rollback ERR

test -r "$TEMPLATE" || fail 'Existing NGINX template is missing'
test -r "$ROOT/index.html" || fail 'Existing Explorer webroot is missing'
grep -Fq 'data-zvq-reference-visual="blue-gold-orbital-20260924"' "$ROOT/index.html" || fail 'Approved Explorer origin not present'
grep -Fq 'data-zvq-token-discovery="indexed-v2"' "$ROOT/index.html" || fail 'Current token-discovery revision missing'
cd "$BASE"
PROXY_ID="$(docker compose ps -q proxy)"
test -n "$PROXY_ID" || fail 'Existing proxy is unavailable'
test "$(grep -Fc 'location = / {' "$TEMPLATE")" -eq 1 || fail 'Unexpected NGINX template layout'
if ! grep -Fq 'ZVQ_ACME_WEBROOT_V1' "$TEMPLATE"; then
  cp -a "$TEMPLATE" "$BACKUP"
  python3 - "$TEMPLATE" <<'PY'
from pathlib import Path
import os,sys
path=Path(sys.argv[1])
source=path.read_text()
needle='    location = / {'
assert source.count(needle)==1,'unexpected NGINX layout'
block='''    # ZVQ_ACME_WEBROOT_V1 — static ACME file path only; no API/RPC rewrite.
    location ^~ /.well-known/acme-challenge/ {
        root /etc/nginx/templates;
        try_files /kam-dashboard$uri =404;
        default_type text/plain;
        add_header Cache-Control "no-store, max-age=0" always;
        limit_except GET { deny all; }
    }

'''
replacement=source.replace(needle,block+needle,1)
temporary=path.with_name(path.name+'.zvq-next')
temporary.write_text(replacement)
st=path.stat()
os.chmod(temporary, st.st_mode)
os.chown(temporary, st.st_uid, st.st_gid)
temporary.replace(path)
PY
  CHANGED=true
fi
install -d -m 0755 "$ROOT/.well-known/acme-challenge"
printf '%s' "$CONTENT" >"$FILE"
chmod 0644 "$FILE"
docker compose config -q
if [[ "$CHANGED" == true ]]; then docker compose up -d --force-recreate proxy; fi
CURRENT_ID="$(docker compose ps -q proxy)"
test -n "$CURRENT_ID" || fail 'Proxy did not restart'
docker exec "$CURRENT_ID" nginx -t
body="$(curl --noproxy '*' -fsS --retry 5 --retry-all-errors --connect-timeout 5 --max-time 20 "http://127.0.0.1/.well-known/acme-challenge/$TOKEN")"
test "$body" = "$CONTENT" || fail 'Exact ACME challenge content not served from origin'
home="$(curl --noproxy '*' -fsS --retry 5 --retry-all-errors --max-time 15 http://127.0.0.1/)"
grep -Fq 'data-zvq-token-discovery="indexed-v2"' <<<"$home" || fail 'Approved Explorer homepage regressed'
echo "origin_acme_rollout=verified-local exact_challenge=yes homepage_indexed_v2=yes backup=$BACKUP"
trap - ERR
