#!/usr/bin/env bash
set -Eeuo pipefail
BASE="/opt/blockscout/docker-compose"
PROXY_DIR="$BASE/proxy"
SOURCE="${1:-explorer-dashboard/zevaryq-production.html}"
case "$SOURCE" in
  /*) ;;
  *) SOURCE="$PWD/$SOURCE" ;;
esac
ASSET_DIR="$(dirname "$SOURCE")/assets"
EMBLEM="$ASSET_DIR/zevaryq-emblem.webp"
FAVICON="$ASSET_DIR/zevaryq-favicon.png"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP="index.html.zevaryq.$STAMP.bak"
TEMPLATE_BACKUP="default.conf.template.zvq-logo.$STAMP.bak"
fail(){ echo "Zevaryq Explorer deploy: $*" >&2; exit 1; }
[[ -f "$SOURCE" ]] || fail "source missing"
[[ -r "$EMBLEM" && -r "$FAVICON" ]] || fail "brand assets missing"
grep -q 'data-zevaryq-explorer-version="1.1.2"' "$SOURCE" || fail "version marker missing"
grep -q 'ZEVARYQ EXPLORER' "$SOURCE" || fail "brand marker missing"
grep -q 'data-zvq-token-discovery="indexed-v2"' "$SOURCE" || fail "token discovery provenance missing"
grep -q "EXPECTED_CHAIN='0x560c'" "$SOURCE" || fail "chain guard missing"
! grep -Eqi '21[ /]+21|128\+ nodes|1,236 pending|3\.4 TPS|100% Secure' "$SOURCE" || fail "mockup metric detected"
cd "$BASE"
PROXY_ID="$(docker compose ps -q proxy)"
[[ -n "$PROXY_ID" ]] || fail "proxy container unavailable"
PROXY_IMAGE="$(docker inspect "$PROXY_ID" --format '{{.Config.Image}}')"
docker image inspect "$PROXY_IMAGE" >/dev/null
proxy_fs(){ docker run --rm --network none -i -v "$PROXY_DIR:/target" "$PROXY_IMAGE" sh -c "$1"; }
proxy_fs "test -r /target/default.conf.template && test -w /target/kam-dashboard"
proxy_fs "cp -a /target/default.conf.template /target/$TEMPLATE_BACKUP"
proxy_fs "cp -a /target/kam-dashboard/index.html /target/kam-dashboard/$BACKUP"
proxy_fs "mkdir -p /target/kam-dashboard/zevaryq-assets; test ! -f /target/kam-dashboard/zevaryq-assets/zevaryq-emblem.webp || cp -a /target/kam-dashboard/zevaryq-assets/zevaryq-emblem.webp /target/kam-dashboard/zevaryq-assets/zevaryq-emblem.webp.$STAMP.bak; test ! -f /target/kam-dashboard/zevaryq-assets/zevaryq-favicon.png || cp -a /target/kam-dashboard/zevaryq-assets/zevaryq-favicon.png /target/kam-dashboard/zevaryq-assets/zevaryq-favicon.png.$STAMP.bak"
rollback(){ code=$?; proxy_fs "cp -a /target/$TEMPLATE_BACKUP /target/default.conf.template; cp -a /target/kam-dashboard/$BACKUP /target/kam-dashboard/index.html; test ! -f /target/kam-dashboard/zevaryq-assets/zevaryq-emblem.webp.$STAMP.bak || cp -a /target/kam-dashboard/zevaryq-assets/zevaryq-emblem.webp.$STAMP.bak /target/kam-dashboard/zevaryq-assets/zevaryq-emblem.webp; test ! -f /target/kam-dashboard/zevaryq-assets/zevaryq-favicon.png.$STAMP.bak || cp -a /target/kam-dashboard/zevaryq-assets/zevaryq-favicon.png.$STAMP.bak /target/kam-dashboard/zevaryq-assets/zevaryq-favicon.png" || true; docker compose up -d --force-recreate --no-deps proxy >/dev/null 2>&1 || true; exit "$code"; }
trap rollback ERR
proxy_fs "cat > /target/kam-dashboard/zevaryq-assets/zevaryq-emblem.webp && chmod 0644 /target/kam-dashboard/zevaryq-assets/zevaryq-emblem.webp" < "$EMBLEM"
proxy_fs "cat > /target/kam-dashboard/zevaryq-assets/zevaryq-favicon.png && chmod 0644 /target/kam-dashboard/zevaryq-assets/zevaryq-favicon.png" < "$FAVICON"
proxy_fs "cat > /target/kam-dashboard/index.html && chmod 0644 /target/kam-dashboard/index.html" < "$SOURCE"
# Serve only the two approved image files. The generic Explorer catch-all
# previously returned HTTP 200 with HTML for both image URLs, which made
# the official ZVQ emblem render as a broken image despite green HTTP checks.
# Keep the rest of NGINX/RPC/Blockscout untouched and retain a rollback copy.
if ! grep -Fq 'ZVQ_OFFICIAL_ASSETS_V1' "$PROXY_DIR/default.conf.template"; then
  python3 - "$PROXY_DIR/default.conf.template" <<'PY'
from pathlib import Path
import os, sys
path=Path(sys.argv[1])
source=path.read_text()
needle='    location = / {'
if source.count(needle)!=1:
    raise SystemExit('Unexpected Explorer NGINX root location; refusing to patch')
if 'location = /zevaryq-assets/zevaryq-emblem.webp' in source or 'location = /zevaryq-assets/zevaryq-favicon.png' in source:
    raise SystemExit('Unexpected existing logo asset route; refusing to overwrite')
block='''    # ZVQ_OFFICIAL_ASSETS_V1 — exact verified binary assets; no SPA fallback.
    location = /zevaryq-assets/zevaryq-emblem.webp {
        root /etc/nginx/templates;
        try_files /kam-dashboard/zevaryq-assets/zevaryq-emblem.webp =404;
        default_type image/webp;
        add_header Cache-Control "public, max-age=300" always;
        add_header X-Content-Type-Options "nosniff" always;
        limit_except GET { deny all; }
    }
    location = /zevaryq-assets/zevaryq-favicon.png {
        root /etc/nginx/templates;
        try_files /kam-dashboard/zevaryq-assets/zevaryq-favicon.png =404;
        default_type image/png;
        add_header Cache-Control "public, max-age=300" always;
        add_header X-Content-Type-Options "nosniff" always;
        limit_except GET { deny all; }
    }

'''
temporary=path.with_name(path.name+'.zvq-logo-staged')
temporary.write_text(source.replace(needle,block+needle,1))
stat=path.stat()
os.chmod(temporary,stat.st_mode)
os.chown(temporary,stat.st_uid,stat.st_gid)
temporary.replace(path)
PY
fi
docker compose config -q
docker compose up -d --force-recreate --no-deps proxy
docker exec "$(docker compose ps -q proxy)" nginx -t
body="$(mktemp)"; trap 'rm -f "$body"' EXIT
# Hard deployment gate: verify the dedicated Explorer origin locally so
# Cloudflare edge throttling (HTTP 429) cannot roll back a valid UI release.
curl -fsS --retry 6 --retry-all-errors --max-time 25 http://127.0.0.1/ -o "$body"
grep -q 'data-zevaryq-explorer-version="1.1.2"' "$body"
grep -q 'ZEVARYQ EXPLORER' "$body"
grep -q 'class="logo logo-zvq"' "$body"
grep -q 'class="earth-brandmark"' "$body"
grep -q 'data-zvq-token-discovery="indexed-v2"' "$body"
for asset in zevaryq-emblem.webp zevaryq-favicon.png; do
  curl -fsS --retry 4 --retry-all-errors --max-time 20 "http://127.0.0.1/zevaryq-assets/$asset" -o "$body"
  expected="$(sha256sum "$ASSET_DIR/$asset" | cut -d\x27 \x27 -f1)"
  observed="$(sha256sum "$body" | cut -d\x27 \x27 -f1)"
  [[ "$observed" == "$expected" ]] || fail "$asset returned wrong bytes; restoring origin"
  echo "verified_local_asset=$asset sha256=$observed"
done

# Origin is proven; subsequent public-edge diagnostics must never trigger
# rollback of a healthy ZVQ origin just because browser/CDN caches are stale.
trap - ERR
# A 200 alone is not release proof: verify the exact ZVQ source markers.
public_code="$(curl -L -sS --connect-timeout 5 --max-time 25 -o /tmp/zevaryq-public.html -w '%{http_code}' https://explorer.kriptoaman.com/ || true)"
echo "public_explorer_http=$public_code"
if [[ "$public_code" == "200" ]]; then
  if grep -Fq 'data-zevaryq-explorer-version="1.1.2"' /tmp/zevaryq-public.html \
    && grep -Fq 'class="logo logo-zvq"' /tmp/zevaryq-public.html \
    && grep -Fq 'class="earth-brandmark"' /tmp/zevaryq-public.html; then
    echo "public_explorer_release=current-v1.1.2"
  else
    echo "::warning::Public Explorer HTTP 200 is serving old visual content although local origin is current. Retrying before reporting release as stale."
    sleep 15
    retry_code="$(curl -L -sS --connect-timeout 5 --max-time 25 -o /tmp/zevaryq-public.html -w '%{http_code}' https://explorer.kriptoaman.com/ || true)"
    if [[ "$retry_code" == "200" ]] \
      && grep -Fq 'data-zevaryq-explorer-version="1.1.2"' /tmp/zevaryq-public.html \
      && grep -Fq 'class="logo logo-zvq"' /tmp/zevaryq-public.html \
      && grep -Fq 'class="earth-brandmark"' /tmp/zevaryq-public.html; then
      echo "public_explorer_release=current-v1.1.2-after-retry"
    else
      # This read-only bypass differentiates a stale default URL from a stale
      # upstream route. Never purge the CDN or restart the chain automatically.
      bypass_url="https://explorer.kriptoaman.com/?zvq_release=1.1.2-$(date -u +%s)"
      bypass_code="$(curl -L -sS --connect-timeout 5 --max-time 25 \
        -H 'Cache-Control: no-cache' -H 'Pragma: no-cache' \
        -o /tmp/zevaryq-public-bypass.html -w '%{http_code}' "$bypass_url" || true)"
      if [[ "$bypass_code" == "200" ]] \
        && grep -Fq 'data-zevaryq-explorer-version="1.1.2"' /tmp/zevaryq-public-bypass.html \
        && grep -Fq 'class="logo logo-zvq"' /tmp/zevaryq-public-bypass.html; then
        echo "public_explorer_release=stale-default-url; cache-bypassed-url=current"
      else
        echo "public_explorer_release=stale-or-unverified; cache-bypassed-http=$bypass_code"
      fi
      if grep -Fq 'data-zevaryq-explorer-version="1.1.1"' /tmp/zevaryq-public.html \
        && grep -Fq 'class="logo logo-zvq"' /tmp/zevaryq-public.html; then
        echo "::warning::Origin v1.1.2 verified; public ZVQ v1.1.1 bridge is awaiting its separate guarded rollout."
        echo "public_explorer_release=previous-verified-v1.1.1-awaiting-bridge"
      else
        echo "::error::Public Explorer does not serve a current or previously verified ZVQ release; inspect routing."
        exit 1
      fi
    fi
  fi
elif [[ "$public_code" == "429" ]]; then
  echo "::warning::Public Explorer rate-limited this runner; origin verification succeeded, public release evidence inconclusive."
else
  echo "::warning::Public Explorer returned HTTP $public_code; origin is healthy, independent public verification remains necessary."
fi

echo "Zevaryq Explorer origin deployed and verified; rollback=$PROXY_DIR/kam-dashboard/$BACKUP"
