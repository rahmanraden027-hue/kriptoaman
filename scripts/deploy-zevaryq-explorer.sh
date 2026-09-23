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
fail(){ echo "Zevaryq Explorer deploy: $*" >&2; exit 1; }
[[ -f "$SOURCE" ]] || fail "source missing"
[[ -r "$EMBLEM" && -r "$FAVICON" ]] || fail "brand assets missing"
grep -q 'data-zevaryq-explorer-version="1.1.1"' "$SOURCE" || fail "version marker missing"
grep -q 'ZEVARYQ EXPLORER' "$SOURCE" || fail "brand marker missing"
grep -q "EXPECTED_CHAIN='0x560c'" "$SOURCE" || fail "chain guard missing"
! grep -Eqi '21[ /]+21|128\+ nodes|1,236 pending|3\.4 TPS|100% Secure' "$SOURCE" || fail "mockup metric detected"
cd "$BASE"
PROXY_ID="$(docker compose ps -q proxy)"
[[ -n "$PROXY_ID" ]] || fail "proxy container unavailable"
PROXY_IMAGE="$(docker inspect "$PROXY_ID" --format '{{.Config.Image}}')"
docker image inspect "$PROXY_IMAGE" >/dev/null
proxy_fs(){ docker run --rm --network none -i -v "$PROXY_DIR:/target" "$PROXY_IMAGE" sh -c "$1"; }
proxy_fs "test -r /target/default.conf.template && test -w /target/kam-dashboard"
proxy_fs "cp -a /target/kam-dashboard/index.html /target/kam-dashboard/$BACKUP"
proxy_fs "mkdir -p /target/kam-dashboard/zevaryq-assets; test ! -f /target/kam-dashboard/zevaryq-assets/zevaryq-emblem.webp || cp -a /target/kam-dashboard/zevaryq-assets/zevaryq-emblem.webp /target/kam-dashboard/zevaryq-assets/zevaryq-emblem.webp.$STAMP.bak; test ! -f /target/kam-dashboard/zevaryq-assets/zevaryq-favicon.png || cp -a /target/kam-dashboard/zevaryq-assets/zevaryq-favicon.png /target/kam-dashboard/zevaryq-assets/zevaryq-favicon.png.$STAMP.bak"
rollback(){ code=$?; proxy_fs "cp -a /target/kam-dashboard/$BACKUP /target/kam-dashboard/index.html; test ! -f /target/kam-dashboard/zevaryq-assets/zevaryq-emblem.webp.$STAMP.bak || cp -a /target/kam-dashboard/zevaryq-assets/zevaryq-emblem.webp.$STAMP.bak /target/kam-dashboard/zevaryq-assets/zevaryq-emblem.webp; test ! -f /target/kam-dashboard/zevaryq-assets/zevaryq-favicon.png.$STAMP.bak || cp -a /target/kam-dashboard/zevaryq-assets/zevaryq-favicon.png.$STAMP.bak /target/kam-dashboard/zevaryq-assets/zevaryq-favicon.png" || true; docker compose up -d --force-recreate proxy >/dev/null 2>&1 || true; exit "$code"; }
trap rollback ERR
proxy_fs "cat > /target/kam-dashboard/zevaryq-assets/zevaryq-emblem.webp && chmod 0644 /target/kam-dashboard/zevaryq-assets/zevaryq-emblem.webp" < "$EMBLEM"
proxy_fs "cat > /target/kam-dashboard/zevaryq-assets/zevaryq-favicon.png && chmod 0644 /target/kam-dashboard/zevaryq-assets/zevaryq-favicon.png" < "$FAVICON"
proxy_fs "cat > /target/kam-dashboard/index.html && chmod 0644 /target/kam-dashboard/index.html" < "$SOURCE"
docker compose config -q
docker compose up -d --force-recreate proxy
body="$(mktemp)"; trap 'rm -f "$body"' EXIT
# Hard deployment gate: verify the dedicated Explorer origin locally so
# Cloudflare edge throttling (HTTP 429) cannot roll back a valid UI release.
curl -fsS --retry 6 --retry-all-errors --max-time 25 http://127.0.0.1/ -o "$body"
grep -q 'data-zevaryq-explorer-version="1.1.1"' "$body"
grep -q 'ZEVARYQ EXPLORER' "$body"
grep -q 'class="logo logo-zvq"' "$body"
grep -q 'class="earth-brandmark"' "$body"
curl -fsS --retry 4 --retry-all-errors --max-time 20 http://127.0.0.1/zevaryq-assets/zevaryq-emblem.webp -o /dev/null
curl -fsS --retry 4 --retry-all-errors --max-time 20 http://127.0.0.1/zevaryq-assets/zevaryq-favicon.png -o /dev/null

# Origin is proven; subsequent public-edge diagnostics must never trigger
# rollback of a healthy ZVQ origin just because browser/CDN caches are stale.
trap - ERR
# A 200 alone is not release proof: verify the exact ZVQ source markers.
public_code="$(curl -L -sS --connect-timeout 5 --max-time 25 -o /tmp/zevaryq-public.html -w '%{http_code}' https://explorer.kriptoaman.com/ || true)"
echo "public_explorer_http=$public_code"
if [[ "$public_code" == "200" ]]; then
  if grep -Fq 'data-zevaryq-explorer-version="1.1.1"' /tmp/zevaryq-public.html \
    && grep -Fq 'class="logo logo-zvq"' /tmp/zevaryq-public.html \
    && grep -Fq 'class="earth-brandmark"' /tmp/zevaryq-public.html; then
    echo "public_explorer_release=current-v1.1.1"
  else
    echo "::warning::Public Explorer HTTP 200 is serving old visual content although local origin is current. Retrying before reporting release as stale."
    sleep 15
    retry_code="$(curl -L -sS --connect-timeout 5 --max-time 25 -o /tmp/zevaryq-public.html -w '%{http_code}' https://explorer.kriptoaman.com/ || true)"
    if [[ "$retry_code" == "200" ]] \
      && grep -Fq 'data-zevaryq-explorer-version="1.1.1"' /tmp/zevaryq-public.html \
      && grep -Fq 'class="logo logo-zvq"' /tmp/zevaryq-public.html \
      && grep -Fq 'class="earth-brandmark"' /tmp/zevaryq-public.html; then
      echo "public_explorer_release=current-v1.1.1-after-retry"
    else
      # This read-only bypass differentiates a stale default URL from a stale
      # upstream route. Never purge the CDN or restart the chain automatically.
      bypass_url="https://explorer.kriptoaman.com/?zvq_release=1.1.1-$(date -u +%s)"
      bypass_code="$(curl -L -sS --connect-timeout 5 --max-time 25 \
        -H 'Cache-Control: no-cache' -H 'Pragma: no-cache' \
        -o /tmp/zevaryq-public-bypass.html -w '%{http_code}' "$bypass_url" || true)"
      if [[ "$bypass_code" == "200" ]] \
        && grep -Fq 'data-zevaryq-explorer-version="1.1.1"' /tmp/zevaryq-public-bypass.html \
        && grep -Fq 'class="logo logo-zvq"' /tmp/zevaryq-public-bypass.html; then
        echo "public_explorer_release=stale-default-url; cache-bypassed-url=current"
      else
        echo "public_explorer_release=stale-or-unverified; cache-bypassed-http=$bypass_code"
      fi
      echo "::error::Public Explorer still shows the legacy ZV interface. The verified origin deployment has been preserved; inspect public routing and caches."
      exit 1
    fi
  fi
elif [[ "$public_code" == "429" ]]; then
  echo "::warning::Public Explorer rate-limited this runner; origin verification succeeded, public release evidence inconclusive."
else
  echo "::warning::Public Explorer returned HTTP $public_code; origin is healthy, independent public verification remains necessary."
fi

echo "Zevaryq Explorer origin deployed and verified; rollback=$PROXY_DIR/kam-dashboard/$BACKUP"
