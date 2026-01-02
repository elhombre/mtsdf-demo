/**
 * MTSDF Material for text rendering
 * Multi-channel True Signed Distance Field shader
 */

'use client'

import { extend } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * MTSDF Vertex Shader
 */
const vertexShader = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

/**
 * MTSDF Fragment Shader
 * Implements multi-channel SDF with alpha fallback
 */
const fragmentShader = /* glsl */ `
  uniform sampler2D map;
  uniform vec3 color;
  uniform float pxRange;
  uniform float threshold;

  varying vec2 vUv;

  // Median of 3 values (for MSDF)
  float median(float r, float g, float b) {
    return max(min(r, g), min(max(r, g), b));
  }

  // Screen-space partial derivatives for anti-aliasing
  float screenPxRange() {
    vec2 unitRange = vec2(pxRange) / vec2(textureSize(map, 0));
    vec2 screenTexSize = vec2(1.0) / fwidth(vUv);
    return max(0.5 * dot(unitRange, screenTexSize), 1.0);
  }

  void main() {
    // Sample texture
    vec4 texel = texture2D(map, vUv);

    // MSDF distance (RGB channels)
    float msdfDist = median(texel.r, texel.g, texel.b);

    // SDF distance (alpha channel, fallback)
    float sdfDist = texel.a;

    // Use MSDF for large sizes, SDF for small sizes
    // For now, just use MSDF only to avoid mixing artifacts
    float spr = screenPxRange();
    float dist = msdfDist; // Pure MSDF, no mixing

    // Debug: visualize distance field
    // gl_FragColor = vec4(vec3(dist), 1.0);
    // return;

    // Convert distance to opacity
    float opacity = smoothstep(threshold - 0.5 / spr, threshold + 0.5 / spr, dist);

    // Output color (no gamma correction - Three.js handles it)
    gl_FragColor = vec4(color, opacity);

    // Discard fully transparent pixels
    if (opacity < 0.01) discard;
  }
`

/**
 * MTSDF Shader Material
 */
export class MTSDFMaterial extends THREE.ShaderMaterial {
  constructor(parameters?: {
    map?: THREE.Texture
    color?: THREE.Color | string | number
    pxRange?: number
    threshold?: number
  }) {
    super({
      uniforms: {
        map: { value: parameters?.map || null },
        color: { value: new THREE.Color(parameters?.color || 0xffffff) },
        pxRange: { value: parameters?.pxRange || 4.0 },
        threshold: { value: parameters?.threshold || 0.5 },
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  }

  // Getters and setters for uniforms
  get map(): THREE.Texture | null {
    return this.uniforms.map.value
  }

  set map(value: THREE.Texture | null) {
    this.uniforms.map.value = value
  }

  get color(): THREE.Color {
    return this.uniforms.color.value
  }

  set color(value: THREE.Color | string | number) {
    this.uniforms.color.value = new THREE.Color(value)
  }

  get pxRange(): number {
    return this.uniforms.pxRange.value
  }

  set pxRange(value: number) {
    this.uniforms.pxRange.value = value
  }

  get threshold(): number {
    return this.uniforms.threshold.value
  }

  set threshold(value: number) {
    this.uniforms.threshold.value = value
  }
}

// Register material with R3F
extend({ MTSDFMaterial })

// Type augmentation for R3F
declare module '@react-three/fiber' {
  interface ThreeElements {
    mTSDFMaterial: typeof MTSDFMaterial
  }
}
