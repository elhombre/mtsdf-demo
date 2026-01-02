# MTSDF Text Rendering Demo

Demo app that showcases scalable GPU text rendering with MTSDF (Multi-channel True Signed Distance Field) and HarfBuzz shaping. Built with Next.js (App Router), React Three Fiber, and TypeScript in strict mode.

## Features

- MTSDF rendering for crisp, scalable text
- HarfBuzz shaping (ligatures/kerning, multilingual)
- Two visualization modes: Plane and Cube (all six faces)
- 10 bundled fonts; on-demand atlas generation with caching
- Font size range 4pt–50pt; MSDF + SDF fallback for tiny sizes
- Minimal UI with loading overlay while atlas is generated

## Tech Stack

- Next.js 16 (App Router), React, TypeScript (strict)
- React Three Fiber + Three.js for 3D
- harfbuzz-modern-wrapper (WASM) for shaping
- msdf-atlas-gen for atlas generation (CLI)
- Tailwind CSS (shadcn-style components)
- Vercel Blob (serverless cache for atlases, public-read objects)

## Requirements

- Node.js 18+
- `msdf-atlas-gen` CLI available (built via `scripts/setup-msdf-atlas-gen.sh` or installed system-wide)
- Fonts present in `public/fonts/` (scripts/setup-fonts.sh can download them)
- For Vercel serverless: `BLOB_READ_WRITE_TOKEN` must be set (used to store atlases in Vercel Blob instead of local disk; objects are uploaded with public access for direct serving)

## Setup

```bash
npm install
# postinstall runs setup-all:
# - downloads fonts (setup-fonts.sh)
# - copies HarfBuzz WASM (setup-harfbuzz.sh)
# - clones/builds msdf-atlas-gen v1.3 (setup-msdf-atlas-gen.sh)
```

If you skip `postinstall`, run manually:
```bash
npm run setup-harfbuzz
npm run setup-fonts
npm run setup-msdf-atlas-gen
```
On Vercel serverless, atlases are stored in Vercel Blob automatically; set `BLOB_READ_WRITE_TOKEN` in project settings. Objects are uploaded as public-read for simplicity. Local/Node runtimes keep using `public/generated` (or `ATLAS_CACHE_DIR` if provided).

## Development

```bash
npm run dev
# open http://localhost:3000
```

## Build & Start

```bash
npm run build
npm start
```

## Linting & Types

```bash
npm run lint       # biome
npx tsc --noEmit   # TypeScript strict check
```

## How It Works (high level)

1. **Atlas generation**: `/api/atlas?font=id` checks `/public/generated/<font>/`; if missing, runs `msdf-atlas-gen` (2048×2048 PNG + JSON metrics, glyph size 48px, pxRange 4). Results are cached on disk.
2. **Shaping**: HarfBuzz (WASM) shapes the static text using the selected font file in `/public/fonts/`.
3. **Geometry**: Quads are generated from shaping data + atlas metrics; UVs map to glyph regions.
4. **Rendering**: Custom MTSDF shader samples RGB (MSDF) with A-channel fallback for tiny sizes; smoothstep for AA. Plane scene and cube faces share the same gradient/text content.
5. **UI**: Sidebar controls (font selector, size slider, mode toggle), splitter to resize sidebar; modal loading overlay during atlas generation.

## Fonts

- Sans: Roboto, Open Sans, Lato, Montserrat
- Serif: Merriweather, PT Serif, Playfair Display
- Mono: JetBrains Mono, Fira Code, Roboto Mono

## Scripts

- `npm run setup-fonts` — downloads required TTFs into `public/fonts/`.
- `npm run setup-harfbuzz` — copies `hb.wasm` and `hbjs.js` into `public/wasm`.
- `npm run setup-msdf-atlas-gen` — clones `external/msdf-atlas-gen`, checks out tag `v1.3`, applies `misc/msdf-atlas-gen.patch` on macOS, builds with CMake (no vcpkg/skia).
- `npm run setup-all` — runs all setup scripts (hooked to `postinstall`, so it also runs on Vercel).

## API

- `GET /api/fonts` → list of fonts `{ id, name, category, file }`
- `GET /api/atlas?font=<id>` → triggers/checks atlas generation, returns `{ atlasUrl, metadata }`

## Troubleshooting

- **Atlas generation on Vercel**: the filesystem is read-only; atlases are generated in `/tmp` and uploaded to Vercel Blob (public-read). Ensure `BLOB_READ_WRITE_TOKEN` is configured; `ATLAS_CACHE_DIR` overrides the local path for non-serverless runs.
- **msdf-atlas-gen not found**: ensure the binary exists at `external/msdf-atlas-gen/build/bin/msdf-atlas-gen` or on PATH; rerun `setup-msdf-atlas-gen.sh`.
- **Fonts missing**: check `public/fonts/` filenames match `lib/server/fonts-config.ts`.
- **Slow first load**: first atlas build per font may take several seconds; cached afterward.

## License

MIT
