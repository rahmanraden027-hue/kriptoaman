#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MASTER_SOURCE="${1:-$ROOT_DIR/design/kriptoaman-shield-master.png}"
WORK_DIR="$ROOT_DIR/tmp/shield-brand"
NAVY="#050D18"

if [[ ! -f "$MASTER_SOURCE" ]]; then
  echo "Missing master logo: $MASTER_SOURCE" >&2
  exit 1
fi

mkdir -p "$WORK_DIR" "$ROOT_DIR/public/brand" "$ROOT_DIR/public/icons" "$ROOT_DIR/public/store-assets"

# Remove only the connected black canvas; the dark shield interior remains intact.
convert "$MASTER_SOURCE" -alpha on -bordercolor black -border 1 \
  -fill none -draw 'matte 0,0 floodfill' -shave 1x1 \
  -trim +repage -resize 880x880 \
  -gravity center -background none -extent 1024x1024 \
  "$WORK_DIR/shield-transparent-1024.png"

# Canonical web/UI assets: transparent artwork with a generous optical margin.
cp "$WORK_DIR/shield-transparent-1024.png" "$ROOT_DIR/public/brand/kriptoaman-logo-final-transparent.png"
cp "$WORK_DIR/shield-transparent-1024.png" "$ROOT_DIR/public/brand/kriptoaman-logo-final.png"
convert "$WORK_DIR/shield-transparent-1024.png" -quality 92 "$ROOT_DIR/public/brand/kriptoaman-mark-premium.webp"
convert "$WORK_DIR/shield-transparent-1024.png" -resize 512x512 "$ROOT_DIR/public/brand/kriptoaman-mark-premium-512.png"
convert "$WORK_DIR/shield-transparent-1024.png" -resize 192x192 "$ROOT_DIR/public/brand/kriptoaman-mark-premium-192.png"

# Standard launcher: navy rounded tile, with the shield at 70% of the canvas.
convert -size 1024x1024 xc:none \
  -fill "$NAVY" -draw 'roundrectangle 0,0 1023,1023 190,190' \
  "$WORK_DIR/launcher-bg.png"
convert "$WORK_DIR/shield-transparent-1024.png" -resize 716x716 "$WORK_DIR/shield-launcher.png"
convert "$WORK_DIR/launcher-bg.png" "$WORK_DIR/shield-launcher.png" \
  -gravity center -compose over -composite "$WORK_DIR/launcher-1024.png"

# Maskable/adaptive safe-area variant: all meaningful artwork remains in the central 60%.
convert -size 1024x1024 "xc:$NAVY" "$WORK_DIR/maskable-bg.png"
convert "$WORK_DIR/shield-transparent-1024.png" -resize 614x614 "$WORK_DIR/shield-maskable.png"
convert "$WORK_DIR/maskable-bg.png" "$WORK_DIR/shield-maskable.png" \
  -gravity center -compose over -composite "$WORK_DIR/maskable-1024.png"

convert "$WORK_DIR/launcher-1024.png" -resize 32x32 "$ROOT_DIR/public/icons/kriptoaman-32.png"
convert "$WORK_DIR/launcher-1024.png" -resize 180x180 "$ROOT_DIR/public/icons/kriptoaman-180.png"
convert "$WORK_DIR/launcher-1024.png" -resize 192x192 "$ROOT_DIR/public/icons/kriptoaman-192.png"
convert "$WORK_DIR/launcher-1024.png" -resize 512x512 "$ROOT_DIR/public/icons/kriptoaman-512.png"
convert "$WORK_DIR/maskable-1024.png" -resize 192x192 "$ROOT_DIR/public/icons/kriptoaman-maskable-192.png"
convert "$WORK_DIR/maskable-1024.png" -resize 512x512 "$ROOT_DIR/public/icons/kriptoaman-maskable-512.png"
convert "$WORK_DIR/launcher-1024.png" -resize 512x512 "$ROOT_DIR/public/store-assets/play-icon-512.png"
convert "$WORK_DIR/launcher-1024.png" -resize 512x512 "$ROOT_DIR/public/kriptoaman-logo-primary.png"

# Android legacy and adaptive launcher resources.
for spec in mdpi:48:108 hdpi:72:162 xhdpi:96:216 xxhdpi:144:324 xxxhdpi:192:432; do
  IFS=: read -r density legacy foreground <<< "$spec"
  target="$ROOT_DIR/android/app/src/main/res/mipmap-$density"
  convert "$WORK_DIR/launcher-1024.png" -resize "${legacy}x${legacy}" "$target/ic_launcher.png"
  convert "$WORK_DIR/launcher-1024.png" -resize "${legacy}x${legacy}" "$target/ic_launcher_round.png"
  convert "$WORK_DIR/shield-maskable.png" -gravity center -background none -extent 1024x1024 \
    -resize "${foreground}x${foreground}" "$target/ic_launcher_foreground.png"
done

# Capacitor splash images: preserve every original canvas dimension and center a safe-size shield.
for splash in "$ROOT_DIR"/android/app/src/main/res/drawable*/splash.png; do
  dimensions="$(identify -format '%wx%h' "$splash")"
  width="${dimensions%x*}"
  height="${dimensions#*x}"
  if (( width < height )); then logo_size=$(( width * 42 / 100 )); else logo_size=$(( height * 48 / 100 )); fi
  convert -size "$dimensions" "xc:$NAVY" \
    \( "$WORK_DIR/shield-transparent-1024.png" -resize "${logo_size}x${logo_size}" \) \
    -gravity center -compose over -composite "$splash"
done

# Store feature graphic: preserve copy and layout, update only the logo zone.
convert "$ROOT_DIR/public/store-assets/feature-graphic-1024x500.png" \
  -fill "$NAVY" -draw 'rectangle 0,0 430,500' \
  \( "$WORK_DIR/shield-transparent-1024.png" -resize 300x300 \) \
  -gravity northwest -geometry +92+96 -compose over -composite \
  "$ROOT_DIR/public/store-assets/feature-graphic-1024x500.png"

echo "Shield brand assets generated successfully."
