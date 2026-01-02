/**
 * Cube scene - text on all 6 cube faces with auto-rotation
 */

'use client'

import { OrbitControls, OrthographicCamera, RenderTexture } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import * as THREE from 'three'
import type { AtlasMetadata, ShapingResult } from '@/lib/client/text/types'
import { DEFAULT_CENTER_COLOR, DEFAULT_EDGE_COLOR, SquareContent } from './square-content'

interface CubeSceneProps {
  shapingResult: ShapingResult
  atlasMetadata: AtlasMetadata
  atlasTexture: THREE.Texture
  fontSize: number
}

interface CubeFaceProps {
  shapingResult: ShapingResult
  atlasMetadata: AtlasMetadata
  atlasTexture: THREE.Texture
  fontSize: number
  position: [number, number, number]
  rotation?: [number, number, number]
  centerColor: [number, number, number]
  edgeColor: [number, number, number]
}

function CubeFace({
  shapingResult,
  atlasMetadata,
  atlasTexture,
  fontSize,
  position,
  rotation,
  centerColor,
  edgeColor,
}: CubeFaceProps) {
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[5, 5]} />
      <meshStandardMaterial roughness={1} metalness={0} toneMapped map={undefined}>
        <RenderTexture attach="map" width={1024} height={1024} colorSpace={THREE.SRGBColorSpace}>
          <OrthographicCamera
            makeDefault
            left={-1.25}
            right={1.25}
            top={1.25}
            bottom={-1.25}
            near={0.1}
            far={100}
            position={[0, 0, 5]}
          />
          <SquareContent
            shapingResult={shapingResult}
            atlasMetadata={atlasMetadata}
            atlasTexture={atlasTexture}
            fontSize={fontSize}
            centerColor={centerColor}
            edgeColor={edgeColor}
          />
        </RenderTexture>
      </meshStandardMaterial>
    </mesh>
  )
}

function RotatingCube({
  shapingResult,
  atlasMetadata,
  atlasTexture,
  fontSize,
  centerColor,
  edgeColor,
}: {
  shapingResult: ShapingResult
  atlasMetadata: AtlasMetadata
  atlasTexture: THREE.Texture
  fontSize: number
  centerColor: [number, number, number]
  edgeColor: [number, number, number]
}) {
  const groupRef = useRef<THREE.Group>(null)
  const [isInteracting, setIsInteracting] = useState(false)

  useFrame((_, delta) => {
    if (groupRef.current && !isInteracting) {
      groupRef.current.rotation.y += delta * 0.2
      groupRef.current.rotation.x += delta * 0.1
    }
  })

  return (
    <>
      <group ref={groupRef}>
        <CubeFace
          shapingResult={shapingResult}
          atlasMetadata={atlasMetadata}
          atlasTexture={atlasTexture}
          fontSize={fontSize}
          centerColor={centerColor}
          edgeColor={edgeColor}
          position={[0, 0, 2.5]}
        />

        <CubeFace
          shapingResult={shapingResult}
          atlasMetadata={atlasMetadata}
          atlasTexture={atlasTexture}
          fontSize={fontSize}
          centerColor={centerColor}
          edgeColor={edgeColor}
          position={[0, 0, -2.5]}
          rotation={[0, Math.PI, 0]}
        />

        <CubeFace
          shapingResult={shapingResult}
          atlasMetadata={atlasMetadata}
          atlasTexture={atlasTexture}
          fontSize={fontSize}
          centerColor={centerColor}
          edgeColor={edgeColor}
          position={[2.5, 0, 0]}
          rotation={[0, Math.PI / 2, 0]}
        />

        <CubeFace
          shapingResult={shapingResult}
          atlasMetadata={atlasMetadata}
          atlasTexture={atlasTexture}
          fontSize={fontSize}
          centerColor={centerColor}
          edgeColor={edgeColor}
          position={[-2.5, 0, 0]}
          rotation={[0, -Math.PI / 2, 0]}
        />

        <CubeFace
          shapingResult={shapingResult}
          atlasMetadata={atlasMetadata}
          atlasTexture={atlasTexture}
          fontSize={fontSize}
          centerColor={centerColor}
          edgeColor={edgeColor}
          position={[0, 2.5, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        />

        <CubeFace
          shapingResult={shapingResult}
          atlasMetadata={atlasMetadata}
          atlasTexture={atlasTexture}
          fontSize={fontSize}
          centerColor={centerColor}
          edgeColor={edgeColor}
          position={[0, -2.5, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        />
      </group>

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={1}
        maxDistance={50}
        onStart={() => setIsInteracting(true)}
        onEnd={() => setIsInteracting(false)}
      />
    </>
  )
}

export function CubeScene({ shapingResult, atlasMetadata, atlasTexture, fontSize }: CubeSceneProps) {
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
        camera={{ position: [10, 8, 12], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.3} />

        <RotatingCube
          shapingResult={shapingResult}
          atlasMetadata={atlasMetadata}
          atlasTexture={atlasTexture}
          fontSize={scaledFontSize}
          centerColor={DEFAULT_CENTER_COLOR}
          edgeColor={DEFAULT_EDGE_COLOR}
        />
      </Canvas>
    </div>
  )
}
