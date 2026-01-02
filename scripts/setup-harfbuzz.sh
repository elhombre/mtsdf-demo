#!/usr/bin/env sh
# Setup HarfBuzz WASM files for browser usage

set -e

echo "Setting up HarfBuzz WASM files..."

# Create wasm directory if it doesn't exist
mkdir -p public/wasm

# Find harfbuzzjs package (works with yarn pnp, npm, etc)
if command -v node &> /dev/null; then
  # Use Node.js to resolve the package path
  HBJS_PATH=$(node -e "console.log(require.resolve('harfbuzzjs/hb.wasm'))")

  if [ -f "$HBJS_PATH" ]; then
    echo "Found hb.wasm at: $HBJS_PATH"
    cp "$HBJS_PATH" public/wasm/hb.wasm
    echo "✓ Copied hb.wasm"
  else
    echo "Error: hb.wasm not found at resolved path"
    exit 1
  fi

  # Also copy hbjs.js if needed
  HBJS_JS_PATH=$(node -e "console.log(require.resolve('harfbuzzjs/hbjs.js'))")
  if [ -f "$HBJS_JS_PATH" ]; then
    echo "Found hbjs.js at: $HBJS_JS_PATH"
    cp "$HBJS_JS_PATH" public/wasm/hbjs.js
    echo "✓ Copied hbjs.js"
  fi
else
  echo "Error: Node.js not found"
  exit 1
fi

echo ""
echo "HarfBuzz WASM setup complete!"
ls -lh public/wasm/
