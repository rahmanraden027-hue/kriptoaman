#!/usr/bin/env bash
set -euo pipefail

BASE="/opt/blockscout/docker-compose"
ENV_FILE="$BASE/envs/common-frontend.env"

if [[ ! -d "$BASE" || ! -f "$ENV_FILE" ]]; then
  echo "Blockscout docker-compose directory or frontend env not found at $BASE" >&2
  exit 1
fi

cd "$BASE"
cp "$ENV_FILE" "$ENV_FILE.bak.$(date +%Y%m%d%H%M%S)"

# Remove existing KriptoAman/branding keys so final values are unique.
sed -i \
  -e '/^NEXT_PUBLIC_NETWORK_NAME=/d' \
  -e '/^NEXT_PUBLIC_NETWORK_SHORT_NAME=/d' \
  -e '/^NEXT_PUBLIC_NETWORK_ID=/d' \
  -e '/^NEXT_PUBLIC_NETWORK_CURRENCY_NAME=/d' \
  -e '/^NEXT_PUBLIC_NETWORK_CURRENCY_SYMBOL=/d' \
  -e '/^NEXT_PUBLIC_NETWORK_CURRENCY_DECIMALS=/d' \
  -e '/^NEXT_PUBLIC_IS_TESTNET=/d' \
  -e '/^NEXT_PUBLIC_NETWORK_LOGO=/d' \
  -e '/^NEXT_PUBLIC_NETWORK_LOGO_DARK=/d' \
  -e '/^NEXT_PUBLIC_NETWORK_ICON=/d' \
  -e '/^NEXT_PUBLIC_NETWORK_ICON_DARK=/d' \
  -e '/^FAVICON_MASTER_URL=/d' \
  -e '/^NEXT_PUBLIC_PROMOTE_BLOCKSCOUT_IN_TITLE=/d' \
  -e '/^NEXT_PUBLIC_AD_BANNER_PROVIDER=/d' \
  -e '/^NEXT_PUBLIC_AD_TEXT_PROVIDER=/d' \
  -e '/^NEXT_PUBLIC_OG_DESCRIPTION=/d' \
  "$ENV_FILE"

cat >> "$ENV_FILE" <<'EOF'

# ===== KRIPTOAMAN EXPLORER FINAL BRAND =====
NEXT_PUBLIC_NETWORK_NAME=KriptoAman Mainnet
NEXT_PUBLIC_NETWORK_SHORT_NAME=KriptoAman
NEXT_PUBLIC_NETWORK_ID=22028
NEXT_PUBLIC_NETWORK_CURRENCY_NAME=KriptoAman
NEXT_PUBLIC_NETWORK_CURRENCY_SYMBOL=KAM
NEXT_PUBLIC_NETWORK_CURRENCY_DECIMALS=18
NEXT_PUBLIC_IS_TESTNET=false
NEXT_PUBLIC_NETWORK_LOGO=https://kriptoaman.com/brand/kriptoaman-explorer.svg
NEXT_PUBLIC_NETWORK_LOGO_DARK=https://kriptoaman.com/brand/kriptoaman-explorer.svg
NEXT_PUBLIC_NETWORK_ICON=https://kriptoaman.com/brand/kriptoaman-mark.svg
NEXT_PUBLIC_NETWORK_ICON_DARK=https://kriptoaman.com/brand/kriptoaman-mark.svg
FAVICON_MASTER_URL=https://kriptoaman.com/brand/kriptoaman-mark.svg
NEXT_PUBLIC_PROMOTE_BLOCKSCOUT_IN_TITLE=false
NEXT_PUBLIC_AD_BANNER_PROVIDER=none
NEXT_PUBLIC_AD_TEXT_PROVIDER=none
NEXT_PUBLIC_OG_DESCRIPTION=KriptoAman Explorer - Official explorer for KriptoAman Mainnet, KAM blocks, transactions, addresses and network activity.
EOF

# Validate public brand assets before restarting frontend.
for url in \
  https://kriptoaman.com/brand/kriptoaman-mark.svg \
  https://kriptoaman.com/brand/kriptoaman-explorer.svg
  do
    code="$(curl -L -sS -o /dev/null -w '%{http_code}' "$url")"
    if [[ "$code" != "200" ]]; then
      echo "Brand asset not ready: $url returned HTTP $code" >&2
      exit 1
    fi
  done

docker compose up -d --force-recreate frontend
sleep 20
docker compose restart proxy
sleep 5

echo "=== SERVICES ==="
docker compose ps frontend proxy backend db

echo "=== LOCAL EXPLORER ==="
curl -sSI http://127.0.0.1:8080 | head -n 1 || true

echo "=== PUBLIC EXPLORER ==="
curl -sSI https://explorer.kriptoaman.com | head -n 1 || true

echo "KriptoAman Explorer branding applied."
