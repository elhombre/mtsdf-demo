/**
 * Quad generator for text rendering
 * Converts shaped glyphs + atlas metadata into Three.js geometry
 */

'use client'

import * as THREE from 'three'
import type { AtlasMetadata, GlyphMetadata, ShapingResult } from './types'

/**
 * Find glyph metadata by unicode code point
 */
function findGlyphMetadata(unicode: number, atlasMetadata: AtlasMetadata): GlyphMetadata | null {
  return atlasMetadata.glyphs.find(g => g.unicode === unicode) || null
}

/**
 * Generate BufferGeometry for shaped text
 * Supports multi-line text with newline characters
 */
export function generateTextGeometry(
  shapingResult: ShapingResult,
  atlasMetadata: AtlasMetadata,
  fontSize: number = 1.0,
  lineHeight: number = 1.2,
): THREE.BufferGeometry {
  const positions: number[] = []
  const uvs: number[] = []
  const indices: number[] = []

  const atlasSize = atlasMetadata.atlasSize
  let cursorX = 0
  let cursorY = 0
  let vertexIndex = 0

  // Calculate line height in world units (fontSize * lineHeight multiplier)
  const lineHeightWorld = fontSize * lineHeight

  // Process each shaped glyph
  for (const shapedGlyph of shapingResult.glyphs) {
    // Handle newline character (unicode 10)
    if (shapedGlyph.unicode === 10) {
      cursorX = 0
      cursorY -= lineHeightWorld
      continue
    }

    const glyphMeta = findGlyphMetadata(shapedGlyph.unicode, atlasMetadata)

    if (!glyphMeta) {
      // Glyph not in atlas (e.g., unsupported character), skip
      cursorX += shapedGlyph.xAdvance * fontSize
      continue
    }

    // Calculate glyph position in world space
    const x = cursorX + shapedGlyph.xOffset * fontSize
    const y = cursorY + shapedGlyph.yOffset * fontSize

    // Glyph plane bounds (normalized, relative to glyph origin)
    const { planeBounds, atlasBounds } = glyphMeta

    // Calculate quad corners in world space
    const left = x + planeBounds.left * fontSize
    const right = x + planeBounds.right * fontSize
    const top = y + planeBounds.top * fontSize
    const bottom = y + planeBounds.bottom * fontSize

    // Calculate UV coordinates (normalized 0-1)
    const uLeft = atlasBounds.left / atlasSize
    const uRight = atlasBounds.right / atlasSize
    const vTop = atlasBounds.top / atlasSize
    const vBottom = atlasBounds.bottom / atlasSize

    // Create quad vertices (two triangles)
    // Vertex order: top-left, top-right, bottom-left, bottom-right

    // Triangle 1: TL, BL, BR
    // Triangle 2: TL, BR, TR

    // Top-left
    positions.push(left, top, 0)
    uvs.push(uLeft, vTop)

    // Bottom-left
    positions.push(left, bottom, 0)
    uvs.push(uLeft, vBottom)

    // Bottom-right
    positions.push(right, bottom, 0)
    uvs.push(uRight, vBottom)

    // Top-right
    positions.push(right, top, 0)
    uvs.push(uRight, vTop)

    // Indices for two triangles
    indices.push(
      vertexIndex, // TL
      vertexIndex + 1, // BL
      vertexIndex + 2, // BR

      vertexIndex, // TL
      vertexIndex + 2, // BR
      vertexIndex + 3, // TR
    )

    vertexIndex += 4

    // Advance cursor
    cursorX += shapedGlyph.xAdvance * fontSize
    cursorY += shapedGlyph.yAdvance * fontSize
  }

  // Create BufferGeometry
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)

  // Center the text geometry
  geometry.computeBoundingBox()
  if (geometry.boundingBox) {
    const center = new THREE.Vector3()
    geometry.boundingBox.getCenter(center)
    geometry.translate(-center.x, -center.y, 0)
  }

  return geometry
}

/**
 * Calculate text bounds (for layout purposes)
 */
export function calculateTextBounds(
  shapingResult: ShapingResult,
  atlasMetadata: AtlasMetadata,
  fontSize: number = 1.0,
): { width: number; height: number } {
  let maxHeight = 0

  for (const shapedGlyph of shapingResult.glyphs) {
    const glyphMeta = findGlyphMetadata(shapedGlyph.unicode, atlasMetadata)
    if (glyphMeta) {
      const height = (glyphMeta.planeBounds.top - glyphMeta.planeBounds.bottom) * fontSize
      maxHeight = Math.max(maxHeight, height)
    }
  }

  return {
    width: shapingResult.totalAdvance * fontSize,
    height: maxHeight,
  }
}
