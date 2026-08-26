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
  -e '/^NEXT_PUBLIC_NAVIGATION_LAYOUT=/d' \
  -e '/^NEXT_PUBLIC_SEO_ENHANCED_DATA_ENABLED=/d' \
  -e '/^NEXT_PUBLIC_OG_ENHANCED_DATA_ENABLED=/d' \
  -e '/^NEXT_PUBLIC_ADDRESS_USERNAME_TAG=/d' \
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
NEXT_PUBLIC_NAVIGATION_LAYOUT=horizontal
NEXT_PUBLIC_SEO_ENHANCED_DATA_ENABLED=true
NEXT_PUBLIC_OG_ENHANCED_DATA_ENABLED=false
NEXT_PUBLIC_OG_DESCRIPTION=KriptoAman Explorer adalah penjelajah resmi KriptoAman Mainnet untuk blok, transaksi, alamat, dan aktivitas jaringan KAM.

# Official public address identity shown by Blockscout on address/transaction views.
# The profile API only returns a username for the verified KAM treasury address.
NEXT_PUBLIC_ADDRESS_USERNAME_TAG={"api_url_template":"https://kriptoaman.com/api/kam/address-profile/{address}","tag_icon":"https://kriptoaman.com/brand/kriptoaman-mark.svg","tag_bg_color":"rgba(14,165,233,0.15)","tag_text_color":"rgb(56,189,248)"}
EOF

# Validate public brand assets and the official treasury profile endpoint before restart.
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

TREASURY_ADDRESS="0xab481451eaf642384d2d9888b355f10d327c5de9"
PROFILE_URL="https://kriptoaman.com/api/kam/address-profile/$TREASURY_ADDRESS"
PROFILE_JSON="$(curl -L -sS "$PROFILE_URL")"
if [[ "$PROFILE_JSON" != *'KAM Treasury'* || "$PROFILE_JSON" != *'PT Kripto Aman Indonesia'* ]]; then
  echo "Treasury profile endpoint is not ready: $PROFILE_URL" >&2
  echo "$PROFILE_JSON" >&2
  exit 1
fi

docker compose up -d --force-recreate frontend
sleep 20
docker compose restart proxy
sleep 5

echo "=== SERVICES ==="
docker compose ps frontend proxy backend db

echo "=== EFFECTIVE BRAND ENV ==="
docker compose exec -T frontend sh -c 'env | grep -E "NEXT_PUBLIC_NETWORK_(NAME|SHORT_NAME|ID|CURRENCY|LOGO|ICON)|NEXT_PUBLIC_NAVIGATION_LAYOUT|NEXT_PUBLIC_PROMOTE_BLOCKSCOUT_IN_TITLE|NEXT_PUBLIC_OG_DESCRIPTION|NEXT_PUBLIC_ADDRESS_USERNAME_TAG|FAVICON_MASTER_URL" | sort' || true

echo "=== KAM TREASURY PROFILE ==="
echo "$PROFILE_JSON"

echo "=== LOCAL EXPLORER ==="
curl -sSI http://127.0.0.1:8080 | head -n 1 || true

echo "=== PUBLIC EXPLORER ==="
curl -sSI https://explorer.kriptoaman.com | head -n 1 || true

echo "KriptoAman Explorer final branding and official KAM Treasury label applied."
