/**
 * API route: GET /api/fonts
 * Returns list of available fonts
 */

import { NextResponse } from 'next/server'
import { FONTS_CONFIG } from '@/lib/server/fonts-config'

export async function GET() {
  const fonts = FONTS_CONFIG.map(font => ({
    id: font.id,
    name: font.name,
    category: font.category,
    file: font.file,
  }))

  return NextResponse.json({ fonts })
}
