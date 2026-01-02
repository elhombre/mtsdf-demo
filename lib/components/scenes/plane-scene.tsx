/**
 * Plane scene - text on a single plane with wrapping
 */

'use client'

import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import type * as THREE from 'three'
import type { AtlasMetadata, ShapingResult } from '@/lib/client/text/types'
import { SquareContent } from './square-content'

interface PlaneSceneProps {
  shapingResult: ShapingResult
  atlasMetadata: AtlasMetadata
  atlasTexture: THREE.Texture
  fontSize: number
}

export function PlaneScene({ shapingResult, atlasMetadata, atlasTexture, fontSize }: PlaneSceneProps) {
  // Calculate camera distance for square to be 80% of viewport height
  // Default zoom level = 1 corresponds to distance 8
  const cameraDistance = 8

  // Scale fontSize for geometry (normalize to reasonable world units)
  // TextMesh will multiply by 0.5 again, so we just divide by 100 here
  const scaledFontSize = fontSize / 100

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'radial-gradient(ellipse at center, #3a7ad0 0%, #050a1a 100%)',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, cameraDistance], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 10, 5]} intensity={1} />

        {/* Background plane and text (shared with cube) */}
        <SquareContent
          shapingResult={shapingResult}
          atlasMetadata={atlasMetadata}
          atlasTexture={atlasTexture}
          fontSize={scaledFontSize}
        />

        {/* Controls - zoom from very close to very far */}
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          enableRotate={false}
          minDistance={cameraDistance * 0.05}
          maxDistance={cameraDistance * 100}
        />
      </Canvas>
    </div>
  )
}
