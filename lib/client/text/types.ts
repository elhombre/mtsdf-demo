/**
 * Type definitions for text rendering, glyphs, and MTSDF atlases
 */

/**
 * 2D bounds (normalized or pixel coordinates)
 */
export interface Bounds {
  left: number
  right: number
  top: number
  bottom: number
}

/**
 * Glyph advance (horizontal and vertical)
 */
export interface Advance {
  x: number
  y: number
}

/**
 * Glyph metadata from atlas JSON
 */
export interface GlyphMetadata {
  /** Unicode code point */
  unicode: number
  /** Advance width and height (normalized 0-1) */
  advance: Advance
  /** Glyph bounds in font space (normalized) */
  planeBounds: Bounds
  /** Glyph bounds in atlas texture (pixel coordinates) */
  atlasBounds: Bounds
}

/**
 * Atlas metadata (from JSON file)
 */
export interface AtlasMetadata {
  /** Atlas texture size (width and height, usually 2048) */
  atlasSize: number
  /** Pixel range for MSDF (usually 4) */
  pxRange: number
  /** All glyphs in the atlas */
  glyphs: GlyphMetadata[]
}

/**
 * Complete atlas data (metadata + texture)
 */
export interface AtlasData {
  /** URL to the atlas PNG texture */
  atlasUrl: string
  /** Atlas metadata */
  metadata: AtlasMetadata
}

/**
 * Shaped glyph from HarfBuzz
 */
export interface ShapedGlyph {
  /** Glyph ID (index in font) */
  glyphId: number
  /** Unicode code point */
  unicode: number
  /** X offset from cursor position */
  xOffset: number
  /** Y offset from cursor position */
  yOffset: number
  /** X advance (how much to move cursor) */
  xAdvance: number
  /** Y advance (usually 0 for horizontal text) */
  yAdvance: number
}

/**
 * Result of text shaping
 */
export interface ShapingResult {
  /** Array of shaped glyphs */
  glyphs: ShapedGlyph[]
  /** Total advance width */
  totalAdvance: number
}

/**
 * Quad vertex data for rendering
 */
export interface QuadVertex {
  /** Vertex position (x, y, z) */
  position: [number, number, number]
  /** UV coordinates (u, v) */
  uv: [number, number]
}

/**
 * Generated quad for a single glyph
 */
export interface GlyphQuad {
  /** 4 vertices (top-left, top-right, bottom-left, bottom-right) */
  vertices: [QuadVertex, QuadVertex, QuadVertex, QuadVertex]
  /** Glyph index */
  glyphIndex: number
}
