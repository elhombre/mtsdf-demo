#!/usr/bin/env sh

# Download fonts directly from reliable CDN
# This script downloads TTF fonts needed for MTSDF atlas generation

set -e

FONTS_DIR="public/fonts"
GOOGLE_FONTS_URL="https://github.com/google/fonts/raw/main/ofl"
mkdir -p "$FONTS_DIR"

echo "📥 Downloading fonts..."
echo ""

# Use raw.githubusercontent.com for direct font downloads
# These are from google/fonts repository

download_font() {
  local url="$1"
  local filename="$2"
  local output_path="$FONTS_DIR/$filename"

  if [ -f "$output_path" ]; then
    echo "✓ $filename already exists, skipping"
    return
  fi

  echo "⬇️  Downloading $filename..."
  if curl -L -f -o "$output_path" "$url" 2>/dev/null; then
    echo "✅ $filename downloaded successfully"
  else
    echo "❌ Failed to download $filename"
  fi
}

# Download each font from Google Fonts repository
download_font "${GOOGLE_FONTS_URL}/firacode/FiraCode%5Bwght%5D.ttf" "FiraCode-Regular.ttf"
download_font "${GOOGLE_FONTS_URL}/jetbrainsmono/JetBrainsMono%5Bwght%5D.ttf" "JetBrainsMono-Regular.ttf"
download_font "${GOOGLE_FONTS_URL}/lato/Lato-Regular.ttf" "Lato-Regular.ttf"
download_font "${GOOGLE_FONTS_URL}/merriweather/Merriweather%5Bopsz%2Cwdth%2Cwght%5D.ttf" "Merriweather-Regular.ttf"
download_font "${GOOGLE_FONTS_URL}/montserrat/Montserrat%5Bwght%5D.ttf" "Montserrat-Regular.ttf"
download_font "${GOOGLE_FONTS_URL}/opensans/OpenSans%5Bwdth%2Cwght%5D.ttf" "OpenSans-Regular.ttf"
download_font "${GOOGLE_FONTS_URL}/playfairdisplay/PlayfairDisplay%5Bwght%5D.ttf" "PlayfairDisplay-Regular.ttf"
download_font "${GOOGLE_FONTS_URL}/ptserif/PT_Serif-Web-Regular.ttf" "PTSerif-Regular.ttf"
download_font "${GOOGLE_FONTS_URL}/roboto/Roboto%5Bwdth%2Cwght%5D.ttf" "Roboto-Regular.ttf"
download_font "${GOOGLE_FONTS_URL}/robotomono/RobotoMono%5Bwght%5D.ttf" "RobotoMono-Regular.ttf"

echo ""
echo "✨ Font download complete!"
echo ""
echo "📁 Available fonts:"
ls -1h "$FONTS_DIR"/*.ttf 2>/dev/null | wc -l | xargs -I {} echo "Total: {}"
echo ""
ls -lh "$FONTS_DIR"/*.ttf 2>/dev/null || echo "No fonts found"
