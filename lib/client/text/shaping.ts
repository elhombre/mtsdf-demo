/**
 * Text shaping using HarfBuzz
 * Converts text strings into positioned glyph sequences
 */

'use client'

import { loadHarfBuzz } from './harfbuzz-loader'
import type { ShapedGlyph, ShapingResult } from './types'

// HarfBuzz instance (initialized once)
let harfbuzzInstance: unknown | null = null
const loadedFonts = new Map<string, ArrayBuffer>()

/**
 * Initialize HarfBuzz (call once at app start)
 */
export async function initializeHarfBuzz(): Promise<void> {
  if (harfbuzzInstance) {
    return // Already initialized
  }

  try {
    const instance = await loadHarfBuzz()
    harfbuzzInstance = instance
    console.log('HarfBuzz initialized successfully')
  } catch (error) {
    console.error('Failed to initialize HarfBuzz:', error)
    throw new Error('Failed to initialize HarfBuzz')
  }
}

/**
 * Load font file as ArrayBuffer
 */
export async function loadFont(fontPath: string): Promise<ArrayBuffer> {
  // Check cache
  if (loadedFonts.has(fontPath)) {
    const cachedFont = loadedFonts.get(fontPath)
    if (cachedFont) {
      return cachedFont
    }
  }

  try {
    const response = await fetch(fontPath)
    if (!response.ok) {
      throw new Error(`Failed to fetch font: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    loadedFonts.set(fontPath, arrayBuffer)
    return arrayBuffer
  } catch (error) {
    console.error(`Failed to load font ${fontPath}:`, error)
    throw error
  }
}

/**
 * Shape text using HarfBuzz
 */
export async function shapeText(text: string, fontPath: string): Promise<ShapingResult> {
  // Ensure HarfBuzz is initialized
  if (!harfbuzzInstance) {
    await initializeHarfBuzz()
  }

  // Load font
  const fontBuffer = await loadFont(fontPath)

  try {
    // Type assertion for HarfBuzz instance
    const hb = harfbuzzInstance as {
      createBlob: (data: ArrayBuffer) => unknown
      createFace: (blob: unknown, index: number) => unknown
      createFont: (face: unknown) => unknown
      createBuffer: () => unknown
      shape: (font: unknown, buffer: unknown) => void
    }

    // Create HarfBuzz blob from font data
    const blob = hb.createBlob(fontBuffer)
    const face = hb.createFace(blob, 0) as {
      upem: number // units per em
    }
    const font = hb.createFont(face)

    // Get units per em for normalization
    const unitsPerEm = face.upem || 2048 // Default to 2048 if not available
    console.log('Font unitsPerEm:', unitsPerEm)

    // Create buffer and add text
    const buffer = hb.createBuffer() as {
      addText: (text: string) => void
      guessSegmentProperties: () => void
      json: () => Array<{ g: number; cl: number; ax: number; ay: number; dx: number; dy: number }>
    }
    buffer.addText(text)
    buffer.guessSegmentProperties()

    // Shape the text
    hb.shape(font, buffer)

    // Get shaped glyphs (returns array directly)
    const glyphs = buffer.json()

    if (!Array.isArray(glyphs) || glyphs.length === 0) {
      console.error('HarfBuzz buffer result:', glyphs)
      throw new Error('HarfBuzz returned invalid result')
    }

    // Normalize glyph values by dividing by unitsPerEm
    // Note: cl is cluster index, not unicode. We need to map it to actual unicode.
    const shapedGlyphs: ShapedGlyph[] = glyphs.map(glyph => {
      // Get the actual unicode character from the cluster index
      const char = text.charCodeAt(glyph.cl)

      return {
        glyphId: glyph.g,
        unicode: char,
        xOffset: (glyph.dx || 0) / unitsPerEm,
        yOffset: (glyph.dy || 0) / unitsPerEm,
        xAdvance: glyph.ax / unitsPerEm,
        yAdvance: (glyph.ay || 0) / unitsPerEm,
      }
    })

    // Calculate total advance (already normalized)
    const totalAdvance = shapedGlyphs.reduce((sum, glyph) => sum + glyph.xAdvance, 0)

    console.log('Shaped glyphs (normalized):', {
      count: shapedGlyphs.length,
      firstGlyph: shapedGlyphs[0],
      totalAdvance,
    })

    return {
      glyphs: shapedGlyphs,
      totalAdvance,
    }
  } catch (error) {
    console.error('Failed to shape text:', error)
    throw error
  }
}

/**
 * Clear font cache
 */
export function clearFontCache(): void {
  loadedFonts.clear()
}
