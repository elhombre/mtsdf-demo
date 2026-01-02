/**
 * API route: GET /api/atlas?font=roboto
 * Returns atlas metadata and URL, generates if not exists
 */

import { type NextRequest, NextResponse } from 'next/server'
import { atlasExists, getAtlasUrl, loadAtlasMetadata } from '@/lib/server/atlas-cache'
import { generateAtlas, isMsdfAtlasGenAvailable } from '@/lib/server/atlas-generator'
import type { FontId } from '@/lib/server/fonts-config'
import { getFontConfig } from '@/lib/server/fonts-config'

const pendingGenerations = new Map<FontId, Promise<void>>()

function queueAtlasGeneration(fontId: FontId) {
  if (!pendingGenerations.has(fontId)) {
    const promise = generateAtlas(fontId)
      .catch(error => {
        console.error(`Failed to generate atlas for ${fontId}:`, error)
      })
      .finally(() => {
        pendingGenerations.delete(fontId)
      })

    pendingGenerations.set(fontId, promise)
  }

  return pendingGenerations.get(fontId)
}

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

  // Check if atlas exists in cache
  if (await atlasExists(fontId)) {
    console.log(`Atlas found in cache for ${fontId}`)

    const metadata = await loadAtlasMetadata(fontId)
    if (!metadata) {
      return NextResponse.json({ error: 'Failed to load atlas metadata' }, { status: 500 })
    }

    return NextResponse.json({
      font: fontId,
      atlasUrl: getAtlasUrl(fontId),
      metadata,
    })
  }

  // Atlas doesn't exist, trigger generation in background and report as pending
  console.log(`Atlas not found for ${fontId}, scheduling generation...`)

  // Check if msdf-atlas-gen is available
  const isAvailable = await isMsdfAtlasGenAvailable()
  if (!isAvailable) {
    return NextResponse.json(
      {
        error: 'msdf-atlas-gen not found',
        message: 'Please install msdf-atlas-gen to generate atlases. See /scripts/setup-msdf.sh for instructions.',
        setupUrl: '/scripts/setup-msdf.sh',
      },
      { status: 503 },
    )
  }

  // Start generation without blocking the request
  queueAtlasGeneration(fontId)

  return NextResponse.json(
    {
      status: 'pending',
      message: 'Atlas generation started',
    },
    { status: 404 },
  )
}
