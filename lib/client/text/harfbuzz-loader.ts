/**
 * Browser-compatible HarfBuzz WASM loader
 */

type HbjsFactory = (instance: WebAssembly.Instance) => unknown

declare global {
  interface Window {
    hbjs?: HbjsFactory
  }
}

// Load the hbjs factory function into global scope
async function loadHbjsScript(): Promise<void> {
  if (typeof window.hbjs !== 'undefined') {
    return // Already loaded
  }

  const response = await fetch('/wasm/hbjs.js')
  const scriptText = await response.text()

  // Execute the script to define hbjs function globally
  const script = document.createElement('script')
  script.textContent = scriptText
  document.head.appendChild(script)

  // Wait a bit for script to execute
  await new Promise(resolve => setTimeout(resolve, 10))
}

/**
 * Load and initialize HarfBuzz WASM
 */
export async function loadHarfBuzz(): Promise<unknown> {
  // Load the hbjs script
  await loadHbjsScript()

  // Load WASM binary
  const wasmResponse = await fetch('/wasm/hb.wasm')
  const wasmBinary = await wasmResponse.arrayBuffer()

  // Instantiate WASM
  const wasmModule = await WebAssembly.instantiate(wasmBinary)

  // Get the hbjs factory function from global scope
  const hbjs = window.hbjs
  if (!hbjs) {
    throw new Error('hbjs function not found in global scope')
  }

  // Initialize and return HarfBuzz instance
  return hbjs(wasmModule.instance)
}
