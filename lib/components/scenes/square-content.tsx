/**
 * Shared square content for plane and cube faces
 * Renders a radial gradient background and the text mesh
 */

'use client'

import type * as THREE from 'three'
import type { AtlasMetadata, ShapingResult } from '@/lib/client/text/types'
import { TextMesh } from './text-mesh'

const squareGradientShader = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    uniform vec3 colorCenter;
    uniform vec3 colorEdge;

    void main() {
      vec2 center = vec2(0.5, 0.5);
      float dist = distance(vUv, center);
      float normalizedDist = dist / 0.707;
      float gradient = pow(normalizedDist, 1.2);
      vec3 color = mix(colorCenter, colorEdge, gradient);
      gl_FragColor = vec4(color, 1.0);
    }
  `,
}

export const DEFAULT_CENTER_COLOR: [number, number, number] = [0.04, 0.04, 0.04]
export const DEFAULT_EDGE_COLOR: [number, number, number] = [0.42, 0.42, 0.42]

interface SquareContentProps {
  shapingResult: ShapingResult
  atlasMetadata: AtlasMetadata
  atlasTexture: THREE.Texture
  fontSize: number
  planeSize?: number
  centerColor?: [number, number, number]
  edgeColor?: [number, number, number]
}

export function SquareContent({
  shapingResult,
  atlasMetadata,
  atlasTexture,
  fontSize,
  planeSize = 2.5,
  centerColor = DEFAULT_CENTER_COLOR,
  edgeColor = DEFAULT_EDGE_COLOR,
}: SquareContentProps) {
  return (
    <>
      <mesh position={[0, 0, -0.1]}>
        <planeGeometry args={[planeSize, planeSize]} />
        <shaderMaterial
          uniforms={{
            colorCenter: { value: centerColor },
            colorEdge: { value: edgeColor },
          }}
          vertexShader={squareGradientShader.vertexShader}
          fragmentShader={squareGradientShader.fragmentShader}
        />
      </mesh>

      <TextMesh
        shapingResult={shapingResult}
        atlasMetadata={atlasMetadata}
        atlasTexture={atlasTexture}
        fontSize={fontSize}
        color={0xffffff}
      />
    </>
  )
}
