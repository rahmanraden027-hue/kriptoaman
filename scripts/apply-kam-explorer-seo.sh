#!/usr/bin/env bash
set -Eeuo pipefail

BASE="/opt/blockscout/docker-compose"
PROXY_DIR="$BASE/proxy"
TEMPLATE="$PROXY_DIR/default.conf.template"
SEO_DIR="${1:-explorer-seo}"
ROBOTS_SOURCE="$SEO_DIR/robots.txt"
SITEMAP_SOURCE="$SEO_DIR/sitemap.xml"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_NAME="default.conf.template.kam-seo.$STAMP.bak"
PATCHED_TEMPLATE="$(mktemp)"
TMP_DIR="$(mktemp -d)"
VERIFY_BODY="$(mktemp)"
VERIFY_HEADERS="$(mktemp)"

fail(){ echo "KAM Explorer SEO apply: $*" >&2; exit 1; }
cleanup(){ rm -f "$PATCHED_TEMPLATE" "$VERIFY_BODY" "$VERIFY_HEADERS"; rm -rf "$TMP_DIR"; }
trap cleanup EXIT

[[ -d "$BASE" && -d "$PROXY_DIR" && -f "$TEMPLATE" ]] || fail "Blockscout proxy boundary unavailable"
[[ -f "$ROBOTS_SOURCE" ]] || fail "robots source missing: $ROBOTS_SOURCE"
[[ -f "$SITEMAP_SOURCE" ]] || fail "sitemap source missing: $SITEMAP_SOURCE"

# Resolve repository assets before changing into the Blockscout compose directory.
# This keeps both scheduled Actions runs and manual invocations path-stable.
ROBOTS_SOURCE="$(realpath "$ROBOTS_SOURCE")"
SITEMAP_SOURCE="$(realpath "$SITEMAP_SOURCE")"

grep -Fq 'Sitemap: https://explorer.kriptoaman.com/sitemap.xml' "$ROBOTS_SOURCE" || fail "robots sitemap directive missing"
grep -Fq '<loc>https://explorer.kriptoaman.com/stats</loc>' "$SITEMAP_SOURCE" || fail "stats canonical missing from sitemap"
grep -Fq '<loc>https://explorer.kriptoaman.com/</loc>' "$SITEMAP_SOURCE" || fail "explorer root missing from sitemap"

SOURCES=(
  explorer-dashboard/index.html
  explorer-dashboard/stats.html
  explorer-dashboard/tokens.html
  explorer-dashboard/developer.html
  explorer-dashboard/developer-docs.html
  explorer-dashboard/developer-examples.html
  explorer-dashboard/developer-verify.html
  explorer-dashboard/developer-starter.html
  explorer-dashboard/addresses.html
  explorer-dashboard/validators.html
  explorer-dashboard/contracts.html
  explorer-dashboard/status.html
)
TARGETS=(
  index.html
  stats.html
  tokens.html
  developer.html
  developer-docs.html
  developer-examples.html
  developer-verify.html
  developer-starter.html
  addresses.html
  validators.html
  contracts.html
  status.html
)
CANONICALS=(
  https://explorer.kriptoaman.com/
  https://explorer.kriptoaman.com/stats
  https://explorer.kriptoaman.com/tokens
  https://explorer.kriptoaman.com/developer
  https://explorer.kriptoaman.com/developer/docs
  https://explorer.kriptoaman.com/developer/examples
  https://explorer.kriptoaman.com/developer/verify
  https://explorer.kriptoaman.com/developer/starter
  https://explorer.kriptoaman.com/addresses
  https://explorer.kriptoaman.com/validators
  https://explorer.kriptoaman.com/contracts
  https://explorer.kriptoaman.com/status
)

[[ ${#SOURCES[@]} -eq ${#TARGETS[@]} && ${#SOURCES[@]} -eq ${#CANONICALS[@]} ]] || fail "SEO mapping length mismatch"

for source in "${SOURCES[@]}"; do
  [[ -f "$source" ]] || fail "Explorer source missing: $source"
done

grep -Fq 'data-kam-stats-version="2.0.0"' explorer-dashboard/stats.html || fail "reviewed stats marker missing"
! grep -Fq 'Placeholder Counter' explorer-dashboard/stats.html || fail "placeholder stats must never be deployed"

inject_seo(){
  local source="$1" output="$2" canonical="$3"
  python3 - "$source" "$output" "$canonical" <<'PY'
from pathlib import Path
import re,sys
source=Path(sys.argv[1]); output=Path(sys.argv[2]); canonical=sys.argv[3]
text=source.read_text(encoding='utf-8')
begin='<!-- KAM_EXPLORER_SEO_BEGIN -->'
end='<!-- KAM_EXPLORER_SEO_END -->'
text=re.sub(re.escape(begin)+r'.*?'+re.escape(end)+r'\s*','',text,flags=re.S)
if '<head>' not in text:
    raise SystemExit(f'head tag missing in {source}')
seo=f'''{begin}\n  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />\n  <link rel="canonical" href="{canonical}" />\n  <meta property="og:url" content="{canonical}" />\n  {end}\n'''
text=text.replace('<head>','<head>\n  '+seo,1)
if text.count('rel="canonical"') != 1:
    raise SystemExit(f'canonical count mismatch in {source}')
output.write_text(text,encoding='utf-8')
PY
}

for i in "${!SOURCES[@]}"; do
  inject_seo "${SOURCES[$i]}" "$TMP_DIR/${TARGETS[$i]}" "${CANONICALS[$i]}"
done

cd "$BASE"
PROXY_ID="$(docker compose ps -q proxy)"
[[ -n "$PROXY_ID" ]] || fail "proxy container unavailable"
PROXY_IMAGE="$(docker inspect "$PROXY_ID" --format '{{.Config.Image}}')"
[[ -n "$PROXY_IMAGE" ]] || fail "proxy image unavailable"
docker image inspect "$PROXY_IMAGE" >/dev/null 2>&1 || fail "proxy image unavailable locally"
proxy_fs(){ docker run --rm --network none -i -v "$PROXY_DIR:/target" "$PROXY_IMAGE" sh -c "$1"; }
proxy_fs "test -r /target/default.conf.template && test -w /target"
proxy_fs "cp -a /target/default.conf.template /target/$BACKUP_NAME"
proxy_fs "mkdir -p /target/kam-dashboard"

for target in "${TARGETS[@]}"; do
  proxy_fs "cat > /target/kam-dashboard/$target && chmod 0644 /target/kam-dashboard/$target" < "$TMP_DIR/$target"
done
proxy_fs "cat > /target/kam-dashboard/robots.txt && chmod 0644 /target/kam-dashboard/robots.txt" < "$ROBOTS_SOURCE"
proxy_fs "cat > /target/kam-dashboard/sitemap.xml && chmod 0644 /target/kam-dashboard/sitemap.xml" < "$SITEMAP_SOURCE"

python3 - "$TEMPLATE" "$PATCHED_TEMPLATE" <<'PY'
from pathlib import Path
import sys
source,out=Path(sys.argv[1]),Path(sys.argv[2])
text=source.read_text()
begin='    # KAM_EXPLORER_SEO_BEGIN\n'
end='    # KAM_EXPLORER_SEO_END\n'
if begin in text:
    before,rest=text.split(begin,1)
    if end not in rest:
        raise SystemExit('incomplete KAM Explorer SEO marker')
    _,after=rest.split(end,1)
    text=before+after
needle='    location / {\n'
if needle not in text:
    raise SystemExit('frontend catch-all location not found')
block='''    # KAM_EXPLORER_SEO_BEGIN
    location = /robots.txt {
        root /etc/nginx/templates;
        try_files /kam-dashboard/robots.txt =404;
        default_type text/plain;
        add_header Cache-Control "public, max-age=3600" always;
        add_header X-Content-Type-Options "nosniff" always;
    }
    location = /sitemap.xml {
        root /etc/nginx/templates;
        try_files /kam-dashboard/sitemap.xml =404;
        default_type application/xml;
        add_header Cache-Control "public, max-age=3600" always;
        add_header X-Content-Type-Options "nosniff" always;
    }
    # KAM_EXPLORER_SEO_END
'''
out.write_text(text.replace(needle,block+needle,1))
PY

grep -Fq 'location = /robots.txt {' "$PATCHED_TEMPLATE" || fail "robots route missing"
grep -Fq 'location = /sitemap.xml {' "$PATCHED_TEMPLATE" || fail "sitemap route missing"
grep -Fq 'KAM_EXPLORER_V2_BEGIN' "$PATCHED_TEMPLATE" || fail "KAM Explorer V2 route block missing"
proxy_fs "cat > /target/default.conf.template" < "$PATCHED_TEMPLATE"

rollback(){
  code=$?
  echo "KAM Explorer SEO apply failed; restoring proxy template." >&2
  proxy_fs "cp -a /target/$BACKUP_NAME /target/default.conf.template" || true
  docker compose up -d --force-recreate --no-deps proxy >/dev/null 2>&1 || true
  exit "$code"
}
trap rollback ERR

# Recreate only the reverse proxy. Dependencies are intentionally left untouched.
docker compose up -d --force-recreate --no-deps proxy

wait_for_stats_ready(){
  local attempts="${1:-20}"
  local attempt
  for ((attempt=1; attempt<=attempts; attempt++)); do
    : > "$VERIFY_BODY"
    : > "$VERIFY_HEADERS"
    if curl -L -fsS --connect-timeout 3 --max-time 8 \
      -H 'Cache-Control: no-cache, no-store' \
      -H 'Pragma: no-cache' \
      -D "$VERIFY_HEADERS" -o "$VERIFY_BODY" \
      "https://explorer.kriptoaman.com/stats?seo_ready=${STAMP}_${attempt}" \
      && grep -Fq 'data-kam-stats-version="2.0.0"' "$VERIFY_BODY" \
      && grep -Fq '<link rel="canonical" href="https://explorer.kriptoaman.com/stats" />' "$VERIFY_BODY" \
      && grep -Fq 'meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"' "$VERIFY_BODY" \
      && grep -Eqi '^x-kam-explorer-stats-version: *2' "$VERIFY_HEADERS" \
      && ! grep -Fq 'Placeholder Counter' "$VERIFY_BODY" \
      && ! grep -Eqi 'amount in ETH|>ETH<' "$VERIFY_BODY"; then
      echo "KAM Explorer proxy ready after attempt $attempt/$attempts."
      return 0
    fi
    sleep 2
  done
  return 1
}

if ! wait_for_stats_ready 20; then
  echo "KAM Explorer proxy did not become ready with verified canonical stats." >&2
  false
fi

verification_error(){
  echo "KAM Explorer SEO verification failed: $*" >&2
  return 1
}

verify_page(){
  local path="$1" canonical="$2" marker="$3"
  local url="https://explorer.kriptoaman.com${path}?seo_verify=${STAMP}_$RANDOM"
  : > "$VERIFY_BODY"
  curl -L -fsS --retry 6 --retry-delay 2 --retry-all-errors --max-time 25 \
    -H 'Cache-Control: no-cache, no-store' -H 'Pragma: no-cache' \
    -o "$VERIFY_BODY" "$url" || verification_error "request failed for $path"
  grep -Fq "$marker" "$VERIFY_BODY" || verification_error "marker missing for $path: $marker"
  grep -Fq "<link rel=\"canonical\" href=\"$canonical\" />" "$VERIFY_BODY" || verification_error "canonical missing for $path"
  grep -Fq 'meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"' "$VERIFY_BODY" || verification_error "robots meta missing for $path"
  echo "seo_page_verified=$path"
}

verify_page '/' 'https://explorer.kriptoaman.com/' 'data-kam-explorer-version="2.0.0"'
verify_page '/stats' 'https://explorer.kriptoaman.com/stats' 'data-kam-stats-version="2.0.0"'
! grep -Fq 'Placeholder Counter' "$VERIFY_BODY" || verification_error "placeholder text exposed on /stats"
! grep -Eqi 'amount in ETH|>ETH<' "$VERIFY_BODY" || verification_error "Ethereum fallback text exposed on /stats"
verify_page '/tokens' 'https://explorer.kriptoaman.com/tokens' 'data-kam-tokens-version="2.0.0"'
verify_page '/developer' 'https://explorer.kriptoaman.com/developer' 'data-kam-developer-version="1.0.0"'
verify_page '/developer/starter' 'https://explorer.kriptoaman.com/developer/starter' 'data-kam-developer-starter-version="1.0.0"'

: > "$VERIFY_BODY"
ROBOTS_URL="https://explorer.kriptoaman.com/robots.txt?seo_verify=${STAMP}_$RANDOM"
curl -L -fsS --retry 5 --retry-delay 2 --retry-all-errors --max-time 25 \
  -H 'Cache-Control: no-cache, no-store' -H 'Pragma: no-cache' \
  -o "$VERIFY_BODY" "$ROBOTS_URL" || verification_error "robots.txt request failed"
grep -Fq 'Sitemap: https://explorer.kriptoaman.com/sitemap.xml' "$VERIFY_BODY" || verification_error "robots sitemap directive missing live"
grep -Fq 'Disallow: /api/' "$VERIFY_BODY" || verification_error "robots API exclusion missing live"
echo 'seo_asset_verified=/robots.txt'

: > "$VERIFY_BODY"
SITEMAP_URL="https://explorer.kriptoaman.com/sitemap.xml?seo_verify=${STAMP}_$RANDOM"
curl -L -fsS --retry 5 --retry-delay 2 --retry-all-errors --max-time 25 \
  -H 'Cache-Control: no-cache, no-store' -H 'Pragma: no-cache' \
  -o "$VERIFY_BODY" "$SITEMAP_URL" || verification_error "sitemap.xml request failed"
grep -Fq '<loc>https://explorer.kriptoaman.com/stats</loc>' "$VERIFY_BODY" || verification_error "stats canonical missing from live sitemap"
grep -Fq '<loc>https://explorer.kriptoaman.com/developer/starter</loc>' "$VERIFY_BODY" || verification_error "starter canonical missing from live sitemap"
echo 'seo_asset_verified=/sitemap.xml'

: > "$VERIFY_HEADERS"
curl -L -sSIf --retry 5 --retry-delay 2 --retry-all-errors --max-time 25 \
  -H 'Cache-Control: no-cache, no-store' -H 'Pragma: no-cache' \
  -o "$VERIFY_HEADERS" "$SITEMAP_URL" || verification_error "sitemap.xml HEAD request failed"
grep -Eqi '^content-type: *application/xml' "$VERIFY_HEADERS" || verification_error "sitemap.xml content-type is not application/xml"

trap - ERR
proxy_fs "rm -f /target/$BACKUP_NAME"
echo "KAM Explorer SEO canonical metadata, robots policy, and sitemap applied successfully."
