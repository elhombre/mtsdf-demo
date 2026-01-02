#!/usr/bin/env sh

# Script to build msdf-atlas-gen for macOS/Linux
# Applies patches for Apple Clang 17 compatibility on macOS
# Bundles required shared libraries for Vercel Linux runtime into bin/msdf/lib

set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
EXTERNAL_DIR="$ROOT_DIR/external"
REPO_DIR="$EXTERNAL_DIR/msdf-atlas-gen"
PATCH_FILE="$ROOT_DIR/misc/msdf-atlas-gen.patch"
REPO_URL="https://github.com/Chlumsky/msdf-atlas-gen.git"
TAG="v1.3"

OUT_DIR="$ROOT_DIR/bin/msdf"
OUT_BIN="$OUT_DIR/msdf-atlas-gen"
OUT_LIB="$OUT_DIR/lib"

echo "==> Ensuring external directory exists at $EXTERNAL_DIR"
mkdir -p "$EXTERNAL_DIR"

if [ ! -d "$REPO_DIR/.git" ]; then
  echo "==> Cloning msdf-atlas-gen ($TAG) into $REPO_DIR"
  git -C "$EXTERNAL_DIR" clone --recurse-submodules "$REPO_URL" msdf-atlas-gen
else
  echo "==> Repository already exists, reusing $REPO_DIR"
fi

cd "$REPO_DIR"

echo "==> Fetching tags and checking out $TAG"
git fetch --tags
git checkout "$TAG"
git submodule update --init --recursive

echo "==> Cleaning previous build artifacts"
rm -rf build

UNAME_S="$(uname -s)"

if [ "$UNAME_S" = "Darwin" ] && [ -f "$PATCH_FILE" ]; then
  echo "==> macOS detected, applying patch $PATCH_FILE"
  if git apply --check "$PATCH_FILE" >/dev/null 2>&1; then
    git apply "$PATCH_FILE"
  else
    echo "    Patch already applied or not applicable; continuing"
  fi
fi

echo "==> Configuring CMake"
mkdir -p build
cd build
cmake -DMSDF_ATLAS_USE_VCPKG=OFF -DMSDF_ATLAS_USE_SKIA=OFF ..

echo "==> Building"
NPROC="$(getconf _NPROCESSORS_ONLN 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 1)"
make -j"$NPROC"

BIN="$REPO_DIR/build/bin/msdf-atlas-gen"
chmod 755 "$BIN"

echo "==> Preparing output dir $OUT_DIR"
mkdir -p "$OUT_LIB"

echo "==> Copying binary -> $OUT_BIN"
cp -L "$BIN" "$OUT_BIN"
chmod 755 "$OUT_BIN"

# On Vercel runtime we need to ship shared libs alongside the binary.
# Build environment has these libs installed, but runtime often does not.
if [ "$UNAME_S" = "Linux" ]; then
  echo "==> Linux detected, bundling runtime shared libraries"

  if ! command -v ldd >/dev/null 2>&1; then
    echo "ERROR: ldd not available; cannot inspect binary dependencies" >&2
    exit 1
  fi

  # Copy all resolved shared libs from common system locations.
  # This avoids whack-a-mole (libpng, freetype, harfbuzz, etc.).
  ldd "$OUT_BIN" | awk '$3 ~ /^\// { print $3 }' | while IFS= read -r SO_PATH; do
    # Skip core system loader/libs that are guaranteed to exist in runtime.
    case "$SO_PATH" in
      /lib64/ld-linux-x86-64.so.2) continue ;;
      /lib64/libc.so.6) continue ;;
      /lib64/libm.so.6) continue ;;
      /lib64/libgcc_s.so.1) continue ;;
      /lib64/libz.so.1) continue ;;
    esac

    # Bundle only from these directories to keep the bundle relevant.
    case "$SO_PATH" in
      /usr/lib64/*|/lib64/*)
        echo "    Copying $SO_PATH -> $OUT_LIB/"
        cp -L "$SO_PATH" "$OUT_LIB/"
        ;;
      *)
        :
        ;;
    esac
  done

  echo "==> Bundled libs:"
  ls -la "$OUT_LIB" || true
fi

echo "==> Done."
echo "    Binary: $OUT_BIN"
if [ "$UNAME_S" = "Linux" ]; then
  echo "    Libs:   $OUT_LIB"
fi
