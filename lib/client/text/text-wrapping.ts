/**
 * Text wrapping utilities for fitting text into bounded areas
 */

'use client'

import type { AtlasMetadata } from './types'

/**
 * Wrap text to fit within a maximum line width.
 * Uses a rough estimate of average glyph advance derived from atlas metadata.
 */
export function wrapTextToWidth(
  text: string,
  maxWidth: number,
  atlasMetadata: AtlasMetadata | null,
  fontSize: number,
): string {
  const lines: string[] = []
  const paragraphs = text.split('\n')

  // Estimate average advance from atlas glyphs (fallback to 0.5 if missing)
  const avgAdvance =
    atlasMetadata && atlasMetadata.glyphs.length > 0
      ? atlasMetadata.glyphs.reduce((sum, glyph) => sum + glyph.advance.x, 0) / atlasMetadata.glyphs.length
      : 0.5

  const avgCharWidth = Math.max(0.001, avgAdvance) * fontSize
  const maxCharsPerLine = Math.max(1, Math.floor(maxWidth / avgCharWidth))

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      lines.push('')
      continue
    }

    const words = paragraph.split(' ')
    let currentLine = ''

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word

      if (testLine.length <= maxCharsPerLine) {
        currentLine = testLine
      } else {
        if (currentLine) {
          lines.push(currentLine)
        }
        currentLine = word
      }
    }

    if (currentLine) {
      lines.push(currentLine)
    }
  }

  return lines.join('\n')
}

/**
 * Generate Lorem ipsum paragraphs to fill a square
 */
export function generateLoremIpsum(paragraphCount: number = 5): string {
  const paragraphs = [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',

    'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',

    'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.',

    'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet.',

    'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia.',

    'Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus ut aut reiciendis.',

    'Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus.',
  ]

  const selected = paragraphs.slice(0, Math.min(paragraphCount, paragraphs.length))
  return selected.join('\n\n')
}
