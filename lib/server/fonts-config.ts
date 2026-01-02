/**
 * Font configuration and charset definition for MTSDF atlas generation
 */

// ASCII printable characters (32-127)
const ASCII_PRINTABLE =
  ' !"#$%&\'()*+,-./0123456789:;<=>?@' + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`' + 'abcdefghijklmnopqrstuvwxyz{|}~'

// Cyrillic (Russian)
const CYRILLIC_RU = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя'

// Typographic symbols
const TYPOGRAPHIC = '\u2013\u2014\u00AB\u00BB\u201C\u201D\u2018\u2019\u2026\u2116\u00A9\u00AE\u2122'

/**
 * Complete charset for atlas generation
 * ~190 characters total
 */
export const CHARSET = ASCII_PRINTABLE + CYRILLIC_RU + TYPOGRAPHIC

/**
 * Font configuration
 */
export const FONTS_CONFIG = [
  // Sans-serif fonts
  {
    id: 'roboto',
    name: 'Roboto',
    category: 'sans-serif',
    file: 'Roboto-Regular.ttf',
    atlasSize: 2048,
    glyphSize: 160,
    pxRange: 8,
  },
  {
    id: 'open-sans',
    name: 'Open Sans',
    category: 'sans-serif',
    file: 'OpenSans-Regular.ttf',
    atlasSize: 2048,
    glyphSize: 160,
    pxRange: 8,
  },
  {
    id: 'lato',
    name: 'Lato',
    category: 'sans-serif',
    file: 'Lato-Regular.ttf',
    atlasSize: 2048,
    glyphSize: 160,
    pxRange: 8,
  },
  {
    id: 'montserrat',
    name: 'Montserrat',
    category: 'sans-serif',
    file: 'Montserrat-Regular.ttf',
    atlasSize: 2048,
    glyphSize: 160,
    pxRange: 8,
  },
  // Serif fonts
  {
    id: 'merriweather',
    name: 'Merriweather',
    category: 'serif',
    file: 'Merriweather-Regular.ttf',
    atlasSize: 2048,
    glyphSize: 160,
    pxRange: 8,
  },
  {
    id: 'pt-serif',
    name: 'PT Serif',
    category: 'serif',
    file: 'PTSerif-Regular.ttf',
    atlasSize: 2048,
    glyphSize: 160,
    pxRange: 8,
  },
  {
    id: 'playfair-display',
    name: 'Playfair Display',
    category: 'serif',
    file: 'PlayfairDisplay-Regular.ttf',
    atlasSize: 2048,
    glyphSize: 160,
    pxRange: 8,
  },
  // Monospace fonts
  {
    id: 'jetbrains-mono',
    name: 'JetBrains Mono',
    category: 'monospace',
    file: 'JetBrainsMono-Regular.ttf',
    atlasSize: 2048,
    glyphSize: 160,
    pxRange: 8,
  },
  {
    id: 'fira-code',
    name: 'Fira Code',
    category: 'monospace',
    file: 'FiraCode-Regular.ttf',
    atlasSize: 2048,
    glyphSize: 160,
    pxRange: 8,
  },
  {
    id: 'roboto-mono',
    name: 'Roboto Mono',
    category: 'monospace',
    file: 'RobotoMono-Regular.ttf',
    atlasSize: 2048,
    glyphSize: 160,
    pxRange: 8,
  },
] as const

export type FontId = (typeof FONTS_CONFIG)[number]['id']
export type FontCategory = (typeof FONTS_CONFIG)[number]['category']

/**
 * Get font config by ID
 */
export function getFontConfig(fontId: FontId) {
  return FONTS_CONFIG.find(f => f.id === fontId)
}

/**
 * Get all available font IDs
 */
export function getAllFontIds(): FontId[] {
  return FONTS_CONFIG.map(f => f.id)
}
