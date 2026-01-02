/**
 * API route: GET /api/atlas/file?font=roboto
 * Streams the generated atlas PNG so it works in production without relying on static file serving.
 */

import { type NextRequest, NextResponse } from 'next/server'
import { readAtlasPng } from '@/lib/server/atlas-cache'
import type { FontId } from '@/lib/server/fonts-config'
import { getFontConfig } from '@/lib/server/fonts-config'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const fontId = searchParams.get('font') as FontId | null

  if (!fontId) {
    return NextResponse.json({ error: 'Missing font parameter' }, { status: 400 })
  }

  // Validate font ID
  const fontConfig = getFontConfig(fontId)
  if (!fontConfig) {
    return NextResponse.json({ error: `Invalid font: ${fontId}` }, { status: 400 })
  }

  const file = await readAtlasPng(fontId)
  if (!file) {
    return NextResponse.json({ error: 'Atlas not found' }, { status: 404 })
  }

  return new NextResponse(Buffer.from(file), {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      // We can cache aggressively because atlas filenames are per-font and immutable once generated
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
