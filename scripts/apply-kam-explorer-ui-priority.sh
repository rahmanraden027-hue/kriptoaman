#!/usr/bin/env bash
set -Eeuo pipefail

BASE="/opt/blockscout/docker-compose"
ENV_FILE="$BASE/envs/common-frontend.env"
HELPER="scripts/apply-kam-explorer-branding.sh"

fail(){ echo "KAM Explorer priority UI: $*" >&2; exit 1; }
[[ -d "$BASE" && -f "$ENV_FILE" ]] || fail "Blockscout frontend environment unavailable"
[[ -f "$HELPER" ]] || fail "reviewed branding helper unavailable"

cp "$ENV_FILE" "$ENV_FILE.priority-ui.$(date -u +%Y%m%dT%H%M%SZ).bak"

sed -i \
  -e '/^NEXT_PUBLIC_COLOR_THEME_DEFAULT=/d' \
  -e '/^NEXT_PUBLIC_OTHER_LINKS=/d' \
  "$ENV_FILE"

cat >> "$ENV_FILE" <<'ENV'

# ===== KAM EXPLORER PRIORITY UI =====
NEXT_PUBLIC_COLOR_THEME_DEFAULT=midnight
NEXT_PUBLIC_OTHER_LINKS=[{"url":"https://explorer.kriptoaman.com/addresses","text":"Addresses"},{"url":"https://explorer.kriptoaman.com/validators","text":"Validators"},{"url":"https://explorer.kriptoaman.com/status","text":"Status"},{"url":"https://explorer.kriptoaman.com/developer","text":"Network & Developers"}]
ENV

# Reuse the already-reviewed frontend-only branding boundary. It recreates only
# the Blockscout frontend and proxy and validates public brand assets first.
chmod +x "$HELPER"
bash "$HELPER"

grep -Fxq 'NEXT_PUBLIC_COLOR_THEME_DEFAULT=midnight' "$ENV_FILE" || fail "midnight theme not persisted"
grep -Fq 'NEXT_PUBLIC_OTHER_LINKS=[{"url":"https://explorer.kriptoaman.com/addresses"' "$ENV_FILE" || fail "Explorer navigation links not persisted"

echo "KAM Explorer native Blockscout UI aligned to midnight KAM presentation."
