/**
 * Main page - MTSDF Text Rendering Demo
 */

'use client'

import { useEffect, useState } from 'react'
import * as THREE from 'three'
import { initializeHarfBuzz, shapeText } from '@/lib/client/text/shaping'
import { generateLoremIpsum, wrapTextToWidth } from '@/lib/client/text/text-wrapping'
import type { AtlasData, ShapingResult } from '@/lib/client/text/types'
import { CubeScene } from '@/lib/components/scenes/cube-scene'
import { PlaneScene } from '@/lib/components/scenes/plane-scene'
import { Button } from '@/lib/components/ui/button'
import { FontSelector } from '@/lib/components/ui/font-selector'
import { FontSizeSlider } from '@/lib/components/ui/font-size-slider'
import { LoadingIndicator } from '@/lib/components/ui/loading-indicator'
import { ModeSelector, type VisualizationMode } from '@/lib/components/ui/mode-selector'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/lib/components/ui/resizable'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/lib/components/ui/sidebar'

// Lorem ipsum text for plane mode (fewer paragraphs for more square shape)
const LOREM_TEXT = generateLoremIpsum(3)

interface Font {
  id: string
  name: string
  category: string
  file: string
}

export default function HomePage() {
  // UI state
  const [fonts, setFonts] = useState<Font[]>([])
  const [selectedFont, setSelectedFont] = useState<string>('roboto')
  const [fontSize, setFontSize] = useState<number>(20)
  const [mode, setMode] = useState<VisualizationMode>('plane')
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true)

  // Loading state
  const [isPreparingAtlas, setIsPreparingAtlas] = useState<boolean>(false)
  const [loadingMessage, setLoadingMessage] = useState<string>('Initializing...')
  const [error, setError] = useState<string | null>(null)

  // Atlas and shaping data
  const [atlasData, setAtlasData] = useState<AtlasData | null>(null)
  const [atlasTexture, setAtlasTexture] = useState<THREE.Texture | null>(null)
  const [shapingResult, setShapingResult] = useState<ShapingResult | null>(null)

  // Load available fonts on mount
  useEffect(() => {
    async function loadFonts() {
      try {
        const response = await fetch('/api/fonts')
        if (!response.ok) {
          throw new Error('Failed to load fonts list')
        }
        const data = await response.json()
        setFonts(data.fonts)
        if (data.fonts.length > 0) {
          setSelectedFont(data.fonts[0].id)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load fonts')
      }
    }

    loadFonts()
  }, [])

  // Initialize HarfBuzz on mount
  useEffect(() => {
    async function init() {
      try {
        setLoadingMessage('Initializing HarfBuzz...')
        await initializeHarfBuzz()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize HarfBuzz')
      }
    }

    init()
  }, [])

  // Load atlas when font changes (poll if not available yet)
  useEffect(() => {
    let cancelled = false

    async function loadAtlas() {
      if (!selectedFont || fonts.length === 0) return

      try {
        setLoadingMessage(`Loading atlas for ${selectedFont}...`)
        setIsPreparingAtlas(false)
        setError(null)

        const parseAtlasResponse = async (response: Response) => {
          const data: AtlasData = await response.json()
          if (cancelled) return

          setAtlasData(data)

          // Load atlas texture
          setLoadingMessage('Loading atlas texture...')
          const texture = await new Promise<THREE.Texture>((resolve, reject) => {
            const loader = new THREE.TextureLoader()
            loader.load(
              data.atlasUrl,
              tex => {
                tex.minFilter = THREE.LinearFilter
                tex.magFilter = THREE.LinearFilter
                tex.colorSpace = THREE.NoColorSpace // MTSDF data should be linear
                tex.generateMipmaps = false
                resolve(tex)
              },
              undefined,
              err => reject(err),
            )
          })

          if (cancelled) return

          setAtlasTexture(texture)
        }

        const pollForAtlas = async () => {
          setIsPreparingAtlas(true)
          setLoadingMessage('Preparing atlas on server...')
          const maxAttempts = 120

          for (let attempt = 0; attempt < maxAttempts && !cancelled; attempt += 1) {
            await new Promise(resolve => setTimeout(resolve, 1000))
            const retry = await fetch(`/api/atlas?font=${selectedFont}`)

            if (retry.status === 404) {
              continue
            }

            if (!retry.ok) {
              const errorData = await retry.json().catch(() => ({}))
              throw new Error(errorData.message || 'Failed to load atlas')
            }

            await parseAtlasResponse(retry)
            return
          }

          throw new Error('Atlas is still preparing. Please try again later.')
        }

        const response = await fetch(`/api/atlas?font=${selectedFont}`)
        if (response.status === 404) {
          await pollForAtlas()
        } else {
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.message || 'Failed to load atlas')
          }

          await parseAtlasResponse(response)
        }

        if (cancelled) return

        setIsPreparingAtlas(false)
      } catch (err) {
        console.error('Failed to load atlas:', err)
        setError(err instanceof Error ? err.message : 'Failed to load atlas')
        setIsPreparingAtlas(false)
      }
    }

    loadAtlas()

    return () => {
      cancelled = true
    }
  }, [selectedFont, fonts])

  // Shape text when atlas or font size changes
  useEffect(() => {
    let cancelled = false

    async function shape() {
      if (!atlasData || !atlasTexture) return

      setLoadingMessage('Shaping text...')
      try {
        const selectedFontData = fonts.find(f => f.id === selectedFont)
        if (!selectedFontData) {
          throw new Error('Font data not found')
        }
        const fontPath = `/fonts/${selectedFontData.file}`

        // Use wrapped Lorem ipsum for both modes with same layout
        const squareSize = 2.5 // world units
        const padding = 0.05 // 5% on each side
        const usableSize = squareSize * (1 - 2 * padding) // 2.25 units

        // Calculate scaled font size (will be multiplied by 0.5 in TextMesh)
        const scaledFontSize = (fontSize / 100) * 0.5
        const avgCharWidth = scaledFontSize * 0.5
        const lineHeight = scaledFontSize * 1.2

        // Calculate how many characters fit per line and how many lines fit
        const charsPerLine = Math.floor(usableSize / avgCharWidth)
        const maxLines = Math.floor(usableSize / lineHeight)

        // Wrap text to fit width
        const maxWidth = charsPerLine * avgCharWidth
        let wrappedText = wrapTextToWidth(LOREM_TEXT, maxWidth, atlasData.metadata, scaledFontSize)

        // Truncate to fit height (cut off lines that don't fit)
        const lines = wrappedText.split('\n')
        if (lines.length > maxLines) {
          wrappedText = lines.slice(0, maxLines).join('\n')
        }

        const shaped = await shapeText(wrappedText, fontPath)
        if (cancelled) return

        setShapingResult(shaped)
      } catch (shapingError) {
        console.warn('Text shaping failed:', shapingError)
        setError(
          shapingError instanceof Error
            ? shapingError.message
            : 'Text shaping failed. Please ensure font files are available.',
        )
      }
    }

    shape()

    return () => {
      cancelled = true
    }
  }, [atlasData, atlasTexture, fontSize, fonts, selectedFont])

  // Render error state
  if (error) {
    return (
      <main>
        <div>
          <h2>Rendering pipeline failed</h2>
          <p>Something went wrong while bootstrapping the demo. Please retry the initialization.</p>
          <p>{error}</p>
          <div>
            <Button variant="outline" onClick={() => window.history.back()}>
              Go back
            </Button>
            <Button variant="destructive" onClick={() => window.location.reload()}>
              Reload page
            </Button>
          </div>
        </div>
      </main>
    )
  }

  const sceneData =
    atlasData && atlasTexture && shapingResult
      ? { atlasMetadata: atlasData.metadata, atlasTexture, shapingResult }
      : null

  // Show overlay only while fetching/building atlas; keep UI visible otherwise
  const loadingAtlas = isPreparingAtlas

  return (
    <main className="h-screen bg-background text-foreground">
      <div className="relative h-full">
        {loadingAtlas && <LoadingIndicator message={loadingMessage} />}
        {!sidebarOpen && (
          <div className="absolute left-4 top-4 z-10">
            <Button variant="outline" size="sm" onClick={() => setSidebarOpen(true)}>
              Show panel
            </Button>
          </div>
        )}

        <ResizablePanelGroup orientation="horizontal" className="h-full">
          {sidebarOpen && (
            <ResizablePanel defaultSize={28} minSize={20}>
              <Sidebar className="h-full border bg-card">
                <SidebarHeader className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Controls</p>
                    <p className="text-xs text-muted-foreground">Rendering settings</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
                    Hide
                  </Button>
                </SidebarHeader>
                <SidebarContent className="space-y-6">
                  <FontSelector fonts={fonts} selectedFont={selectedFont} onFontChange={setSelectedFont} />
                  <FontSizeSlider fontSize={fontSize} minSize={4} maxSize={50} onFontSizeChange={setFontSize} />
                  <ModeSelector mode={mode} onModeChange={setMode} />
                </SidebarContent>
                <SidebarFooter>
                  <p className="text-xs text-muted-foreground">MTSDF demo</p>
                </SidebarFooter>
              </Sidebar>
            </ResizablePanel>
          )}

          {sidebarOpen && <ResizableHandle />}

          <ResizablePanel defaultSize={sidebarOpen ? 72 : 100}>
            <div className="h-full">
              {sceneData ? (
                mode === 'plane' ? (
                  <PlaneScene
                    shapingResult={sceneData.shapingResult}
                    atlasMetadata={sceneData.atlasMetadata}
                    atlasTexture={sceneData.atlasTexture}
                    fontSize={fontSize}
                  />
                ) : (
                  <CubeScene
                    shapingResult={sceneData.shapingResult}
                    atlasMetadata={sceneData.atlasMetadata}
                    atlasTexture={sceneData.atlasTexture}
                    fontSize={fontSize}
                  />
                )
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Loading atlas...
                </div>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </main>
  )
}
