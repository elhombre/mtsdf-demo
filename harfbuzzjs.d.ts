/**
 * Type definitions for harfbuzzjs
 * HarfBuzz WASM bindings for JavaScript
 */

declare module 'harfbuzzjs' {
  interface HarfBuzzBlob {
    destroy(): void
  }

  interface HarfBuzzFace {
    destroy(): void
  }

  interface HarfBuzzFont {
    destroy(): void
  }

  interface HarfBuzzBuffer {
    addText(text: string): void
    guessSegmentProperties(): void
    json(): Array<{
      g: number // glyph ID
      cl: number // cluster index
      ax: number // x advance
      ay: number // y advance
      dx: number // x offset
      dy: number // y offset
    }>
    destroy(): void
  }

  interface HarfBuzzInstance {
    createBlob(data: ArrayBuffer): HarfBuzzBlob
    createFace(blob: HarfBuzzBlob, index: number): HarfBuzzFace
    createFont(face: HarfBuzzFace): HarfBuzzFont
    createBuffer(): HarfBuzzBuffer
    shape(font: HarfBuzzFont, buffer: HarfBuzzBuffer): void
  }

  type HarfBuzzFactory = () => Promise<HarfBuzzInstance>

  const hbjs: HarfBuzzFactory
  export default hbjs
}
