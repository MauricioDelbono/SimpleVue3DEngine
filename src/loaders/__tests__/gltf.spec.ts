import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GLTFLoader } from '../gltf'
import { Entity } from '@/models/entity'
import { Mesh } from '@/models/mesh'

// Mock Textures
vi.mock('@/helpers/texture', () => ({
  default: {
    createTextureFromImage: vi.fn().mockResolvedValue({} as WebGLTexture)
  }
}))

describe('GLTFLoader', () => {
  let loader: GLTFLoader

  beforeEach(() => {
    loader = new GLTFLoader()
    global.fetch = vi.fn()
    global.URL.createObjectURL = vi.fn()
    global.URL.revokeObjectURL = vi.fn()
  })

  it('should load a minimal GLB', async () => {
      // 1. Create BIN data (Float32Array of positions: 3 vertices * 3 floats * 4 bytes = 36 bytes)
      const vertices = new Float32Array([
        0, 0, 0,
        1, 0, 0,
        0, 1, 0
      ])
      const binData = new Uint8Array(vertices.buffer)

      // 2. Create JSON
      const json = {
        asset: { version: "2.0" },
        scenes: [{ nodes: [0] }],
        nodes: [{ mesh: 0 }],
        meshes: [{
          primitives: [{
            attributes: { POSITION: 0 }
          }]
        }],
        accessors: [{
          bufferView: 0,
          componentType: 5126, // FLOAT
          count: 3,
          type: "VEC3"
        }],
        bufferViews: [{
          buffer: 0,
          byteLength: binData.byteLength,
          byteOffset: 0
        }],
        buffers: [{
          byteLength: binData.byteLength
        }]
      }
      const jsonStr = JSON.stringify(json)
      const jsonBytes = new TextEncoder().encode(jsonStr)
      // Pad JSON to 4 bytes
      const jsonPadding = (4 - (jsonBytes.byteLength % 4)) % 4
      const paddedJsonLength = jsonBytes.byteLength + jsonPadding

      // 3. Construct Buffer
      const totalLength = 12 + 8 + paddedJsonLength + 8 + binData.byteLength
      const buffer = new ArrayBuffer(totalLength)
      const view = new DataView(buffer)

      // Header
      view.setUint32(0, 0x46546c67, true) // magic
      view.setUint32(4, 2, true) // version
      view.setUint32(8, totalLength, true) // length

      // JSON Chunk Header
      view.setUint32(12, paddedJsonLength, true) // chunkLength
      view.setUint32(16, 0x4e4f534a, true) // chunkType

      // JSON Data
      const uint8View = new Uint8Array(buffer)

      uint8View.set(jsonBytes, 20)
      for(let i=0; i<jsonPadding; i++) uint8View[20 + jsonBytes.byteLength + i] = 0x20 // Space padding

      // BIN Chunk Header
      const binOffset = 20 + paddedJsonLength
      view.setUint32(binOffset, binData.byteLength, true)
      view.setUint32(binOffset + 4, 0x004e4942, true)

      // BIN Data
      // Copy manual to avoid environment weirdness with .set()
      for(let i=0; i<binData.length; i++) {
         uint8View[binOffset + 8 + i] = binData[i];
      }

    // Mock fetch response
    (global.fetch as any).mockResolvedValue({
      arrayBuffer: () => Promise.resolve(buffer)
    })

    const entity = await loader.load({} as WebGL2RenderingContext, 'test.glb')

    expect(entity).toBeInstanceOf(Entity)
    expect(entity.children.length).toBe(1) // Root -> Node
    const node = entity.children[0]
    expect(node.mesh).toBeInstanceOf(Mesh)
    expect(node.mesh.positions).toBeInstanceOf(Float32Array)
    expect(node.mesh.positions[3]).toBe(1) // Second vertex x
  })
})
