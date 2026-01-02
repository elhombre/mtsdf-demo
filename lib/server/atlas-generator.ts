/**
 * MTSDF Atlas Generator
 * Generates MTSDF atlases using msdf-atlas-gen CLI tool
 */

import { execFile } from 'node:child_process'
import { existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { promisify } from 'node:util'
import type { AtlasMetadata, GlyphMetadata } from '../client/text/types'
import { ensureAtlasDir, prepareAtlasGeneration } from './atlas-cache'
import type { FontId } from './fonts-config'
import { CHARSET, getFontConfig } from './fonts-config'

const execFileAsync = promisify(execFile)

// Path to msdf-atlas-gen binary (built locally)
const MSDF_ATLAS_GEN = join(process.cwd(), 'external/msdf-atlas-gen/build/bin/msdf-atlas-gen')

function getMsdfEnv(): NodeJS.ProcessEnv {
  // Vercel/Linux needs LD_LIBRARY_PATH to find bundled shared libs.
  // macOS uses DYLD_* and Windows uses PATH, so we do nothing there.
  if (process.platform !== 'linux') {
    return process.env
  }

  // If you bundle .so files next to the binary (recommended: bin/msdf/lib),
  // point the dynamic linker to that folder.
  const libDir = join(process.cwd(), 'bin', 'msdf', 'lib')
  if (!existsSync(libDir)) {
    return process.env
  }

  const prev = process.env.LD_LIBRARY_PATH
  const next = prev ? `${libDir}:${prev}` : libDir

  return {
    ...process.env,
    LD_LIBRARY_PATH: next,
  }
}

/**
 * Check if msdf-atlas-gen is installed
 */
export async function isMsdfAtlasGenAvailable(): Promise<boolean> {
  try {
    await execFileAsync(MSDF_ATLAS_GEN, ['--version'], { env: getMsdfEnv() })
    return true
  } catch {
    return false
  }
}

/**
 * Generate charset file for msdf-atlas-gen
 */
function generateCharsetFile(outputPath: string): void {
  // Convert charset string to array of unicode code points
  const codePoints = Array.from(CHARSET).map(char => char.charCodeAt(0))

  // Write as newline-separated decimal values
  const content = codePoints.join('\n')
  writeFileSync(outputPath, content, 'utf-8')
}

/**
 * Parse msdf-atlas-gen JSON output and convert to our format
 */
function parseAtlasJson(msdfJson: string, atlasSize: number, pxRange: number): AtlasMetadata {
  const parsed = JSON.parse(msdfJson)

  // Convert glyphs to our format
  const glyphs: GlyphMetadata[] = parsed.glyphs.map(
    (glyph: {
      unicode: number
      advance: number
      planeBounds?: { left: number; bottom: number; right: number; top: number }
      atlasBounds?: { left: number; bottom: number; right: number; top: number }
    }) => {
      const planeBounds = glyph.planeBounds || { left: 0, bottom: 0, right: 0, top: 0 }
      const atlasBounds = glyph.atlasBounds || { left: 0, bottom: 0, right: 0, top: 0 }

      return {
        unicode: glyph.unicode,
        advance: {
          x: glyph.advance || 0,
          y: 0,
        },
        planeBounds: {
          left: planeBounds.left,
          right: planeBounds.right,
          top: planeBounds.top,
          bottom: planeBounds.bottom,
        },
        atlasBounds: {
          left: atlasBounds.left,
          right: atlasBounds.right,
          top: atlasBounds.top,
          bottom: atlasBounds.bottom,
        },
      }
    },
  )

  return {
    atlasSize,
    pxRange,
    glyphs,
  }
}

/**
 * Generate MTSDF atlas for a font
 */
export async function generateAtlas(fontId: FontId): Promise<void> {
  const fontConfig = getFontConfig(fontId)
  if (!fontConfig) {
    throw new Error(`Font config not found for: ${fontId}`)
  }

  // Check if msdf-atlas-gen is available
  const isAvailable = await isMsdfAtlasGenAvailable()
  if (!isAvailable) {
    throw new Error('msdf-atlas-gen binary not found. Please build it first: npm run build-msdf-atlas-gen')
  }

  const target = prepareAtlasGeneration(fontId)
  const fontPath = join(process.cwd(), 'public', 'fonts', fontConfig.file)
  const charsetFile = target.charsetPath

  // Check if font file exists
  if (!existsSync(fontPath)) {
    throw new Error(`Font file not found: ${fontPath}`)
  }

  // Create output directory
  await ensureAtlasDir(target.dir)

  // Generate charset file
  generateCharsetFile(charsetFile)

  // Build msdf-atlas-gen args
  const args = [
    '-font',
    fontPath,
    '-charset',
    charsetFile,
    '-type',
    'mtsdf', // Multi-channel True SDF (MSDF + SDF in alpha)
    '-format',
    'png',
    '-dimensions',
    `${fontConfig.atlasSize}`,
    `${fontConfig.atlasSize}`,
    '-pxrange',
    fontConfig.pxRange.toString(),
    '-size',
    fontConfig.glyphSize.toString(),
    '-angle',
    '3.0', // Typical maxCornerAngle value (in radians)
    '-coloringstrategy',
    'distance', // Maximize distance between same-color edges
    '-errorcorrection',
    'auto-mixed', // Detect distance errors by exact evaluation
    '-scanline', // Additional pass to fix signs of distances
    '-overlap', // Support for overlapping contours
    '-imageout',
    target.pngPath,
    '-json',
    target.jsonPath,
  ]

  console.log(`Generating atlas for ${fontId}...`)
  console.log(`Binary: ${MSDF_ATLAS_GEN}`)
  console.log(`Args: ${args.join(' ')}`)

  try {
    const { stdout, stderr } = await execFileAsync(MSDF_ATLAS_GEN, args, { env: getMsdfEnv() })

    if (stderr) {
      console.warn(`msdf-atlas-gen warnings: ${stderr}`)
    }

    if (stdout) {
      console.log(`msdf-atlas-gen output: ${stdout}`)
    }

    // Read the generated JSON and convert to our format
    const fs = await import('node:fs/promises')
    const msdfJson = await fs.readFile(target.jsonPath, 'utf-8')
    const metadata = parseAtlasJson(msdfJson, fontConfig.atlasSize, fontConfig.pxRange)

    // Write our formatted JSON
    await fs.writeFile(target.jsonPath, JSON.stringify(metadata, null, 2), 'utf-8')

    // Persist to blob when needed
    await target.persist()

    console.log(`Atlas generated successfully for ${fontId}`)
  } catch (error) {
    console.error(`Failed to generate atlas for ${fontId}:`, error)
    throw error
  }
}
