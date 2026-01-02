/**
 * Text mesh component for MTSDF text rendering
 */

'use client'

import { useMemo } from 'react'
import type * as THREE from 'three'
import { MTSDFMaterial } from '@/lib/client/shaders/mtsdf-material'
import { generateTextGeometry } from '@/lib/client/text/quad-generator'
import type { AtlasMetadata, ShapingResult } from '@/lib/client/text/types'

interface TextMeshProps {
  shapingResult: ShapingResult
  atlasMetadata: AtlasMetadata
  atlasTexture: THREE.Texture
  fontSize: number
  color?: string | number
  position?: [number, number, number]
  rotation?: [number, number, number]
}

export function TextMesh({
  shapingResult,
  atlasMetadata,
  atlasTexture,
  fontSize,
  color: _color = 0xffffff,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: TextMeshProps) {
  console.log('TextMesh rendering with:', {
    glyphCount: shapingResult.glyphs.length,
    fontSize,
    position,
    hasAtlasTexture: !!atlasTexture,
  })

  // Generate geometry (memoized to avoid re-generation)
  const geometry = useMemo(() => {
    console.log('Generating geometry from', shapingResult.glyphs.length, 'glyphs')
    const geom = generateTextGeometry(shapingResult, atlasMetadata, fontSize * 0.5) // Much larger scale

    const posAttr = geom.attributes.position
    const indexAttr = geom.index

    console.log('Geometry attributes:', {
      hasPosition: !!posAttr,
      positionCount: posAttr?.count,
      hasIndex: !!indexAttr,
      indexCount: indexAttr?.count,
    })

    if (posAttr && posAttr.count > 0) {
      // Log first vertex to verify positions
      console.log('First vertex:', [posAttr.getX(0).toFixed(2), posAttr.getY(0).toFixed(2), posAttr.getZ(0).toFixed(2)])
    }

    const bbox = geom.boundingBox
    if (bbox) {
      const width = bbox.max.x - bbox.min.x
      const height = bbox.max.y - bbox.min.y
      console.log('Bounding box:', {
        width: width.toFixed(2),
        height: height.toFixed(2),
        min: `(${bbox.min.x.toFixed(2)}, ${bbox.min.y.toFixed(2)}, ${bbox.min.z.toFixed(2)})`,
        max: `(${bbox.max.x.toFixed(2)}, ${bbox.max.y.toFixed(2)}, ${bbox.max.z.toFixed(2)})`,
      })
    } else {
      console.warn('No bounding box!')
    }

    return geom
  }, [shapingResult, atlasMetadata, fontSize])

  // Create material (memoized) - using MTSDF material
  const material = useMemo(() => {
    const img = atlasTexture?.image as HTMLImageElement | undefined
    console.log('Creating MTSDF material with texture:', {
      hasTexture: !!atlasTexture,
      textureSize: img ? `${img.width}x${img.height}` : 'N/A',
      pxRange: atlasMetadata.pxRange,
    })

    return new MTSDFMaterial({
      map: atlasTexture,
      color: 0xffffff,
      pxRange: atlasMetadata.pxRange,
      threshold: 0.435,
    })
  }, [atlasTexture, atlasMetadata.pxRange])

  // Cleanup on unmount
  useMemo(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  return <mesh geometry={geometry} material={material} position={position} rotation={rotation} />
}
