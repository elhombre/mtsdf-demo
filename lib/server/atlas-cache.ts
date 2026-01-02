/**
 * Atlas caching utilities
 * Encapsulates storage for atlas PNG/JSON (local FS or Vercel Blob)
 */

import { existsSync } from 'node:fs'
import path from 'node:path'
import { head, put } from '@vercel/blob'
import type { AtlasMetadata } from '../client/text/types'

const FALLBACK_CACHE_DIR = '/tmp/mtsdf-generated'
const BLOB_PREFIX = 'atlas'

function isServerlessRuntime(): boolean {
  return (
    process.env.VERCEL === '1' ||
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) ||
    Boolean(process.env.LAMBDA_TASK_ROOT) ||
    process.cwd().startsWith('/var/task')
  )
}

function isBlobEnabled(): boolean {
  const hasToken = Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_TOKEN)
  return isServerlessRuntime() && hasToken
}

function getLocalBaseDir(): string {
  if (process.env.ATLAS_CACHE_DIR) {
    return process.env.ATLAS_CACHE_DIR
  }

  return path.join(process.cwd(), 'public', 'generated')
}

function getBlobKey(fontId: string, fileName: string): string {
  return `${BLOB_PREFIX}/${fontId}/${fileName}`
}

function getBlobToken(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_TOKEN
}

async function blobExists(key: string): Promise<boolean> {
  try {
    await head(key, { token: getBlobToken() })
    return true
  } catch {
    return false
  }
}

async function blobRead(key: string): Promise<Uint8Array | null> {
  try {
    const blob = await head(key, { token: getBlobToken() })
    const url = blob.downloadUrl || blob.url
    if (!url) return null

    const res = await fetch(url)
    if (!res.ok) return null
    const arrayBuffer = await res.arrayBuffer()
    return new Uint8Array(arrayBuffer)
  } catch {
    return null
  }
}

async function blobWrite(key: string, data: Uint8Array, contentType: string): Promise<void> {
  await put(key, Buffer.from(data), {
    access: 'public',
    contentType,
    token: getBlobToken(),
    addRandomSuffix: false,
  })
}

export interface AtlasGenerationTarget {
  dir: string
  pngPath: string
  jsonPath: string
  charsetPath: string
  persist: () => Promise<void>
}

/**
 * Prepare paths for atlas generation.
 * In local mode, writes to public/generated; in serverless mode, writes to /tmp and uploads to Blob on persist().
 */
export function prepareAtlasGeneration(fontId: string): AtlasGenerationTarget {
  const useBlob = isBlobEnabled()
  const baseDir = useBlob ? FALLBACK_CACHE_DIR : isServerlessRuntime() ? FALLBACK_CACHE_DIR : getLocalBaseDir()
  const dir = path.join(baseDir, fontId)
  const pngPath = path.join(dir, 'atlas.png')
  const jsonPath = path.join(dir, 'atlas.json')
  const charsetPath = path.join(dir, 'charset.txt')

  const persist = async () => {
    if (!useBlob) return

    const fs = await import('node:fs/promises')
    const pngData = await fs.readFile(pngPath)
    const jsonData = await fs.readFile(jsonPath)

    await blobWrite(getBlobKey(fontId, 'atlas.png'), pngData, 'image/png')
    await blobWrite(getBlobKey(fontId, 'atlas.json'), jsonData, 'application/json')
  }

  return { dir, pngPath, jsonPath, charsetPath, persist }
}

/**
 * Check if atlas exists in cache (local or blob)
 */
export async function atlasExists(fontId: string): Promise<boolean> {
  if (isBlobEnabled()) {
    const [pngOk, jsonOk] = await Promise.all([
      blobExists(getBlobKey(fontId, 'atlas.png')),
      blobExists(getBlobKey(fontId, 'atlas.json')),
    ])
    return pngOk && jsonOk
  }

  const baseDir = isServerlessRuntime() ? FALLBACK_CACHE_DIR : getLocalBaseDir()
  const pngPath = path.join(baseDir, fontId, 'atlas.png')
  const jsonPath = path.join(baseDir, fontId, 'atlas.json')
  return existsSync(pngPath) && existsSync(jsonPath)
}

/**
 * Load atlas metadata (local or blob)
 */
export async function loadAtlasMetadata(fontId: string): Promise<AtlasMetadata | null> {
  if (isBlobEnabled()) {
    const data = await blobRead(getBlobKey(fontId, 'atlas.json'))
    if (!data) return null
    return JSON.parse(Buffer.from(data).toString('utf-8')) as AtlasMetadata
  }

  const baseDir = isServerlessRuntime() ? FALLBACK_CACHE_DIR : getLocalBaseDir()
  const jsonPath = path.join(baseDir, fontId, 'atlas.json')
  if (!existsSync(jsonPath)) return null

  const fs = await import('node:fs/promises')
  const content = await fs.readFile(jsonPath, 'utf-8')
  return JSON.parse(content) as AtlasMetadata
}

/**
 * Read atlas PNG as Buffer/Uint8Array (local or blob)
 */
export async function readAtlasPng(fontId: string): Promise<Uint8Array | null> {
  if (isBlobEnabled()) {
    return blobRead(getBlobKey(fontId, 'atlas.png'))
  }

  const baseDir = isServerlessRuntime() ? FALLBACK_CACHE_DIR : getLocalBaseDir()
  const pngPath = path.join(baseDir, fontId, 'atlas.png')
  if (!existsSync(pngPath)) return null

  const fs = await import('node:fs/promises')
  const data = await fs.readFile(pngPath)
  return new Uint8Array(data)
}

/**
 * URL for serving atlas PNG (kept for client compatibility)
 */
export function getAtlasUrl(fontId: string): string {
  return `/api/atlas/file?font=${fontId}`
}

/**
 * Ensure directory exists (local or tmp) before writing.
 */
export async function ensureAtlasDir(dir: string): Promise<void> {
  const fs = await import('node:fs/promises')
  await fs.mkdir(dir, { recursive: true })
}
