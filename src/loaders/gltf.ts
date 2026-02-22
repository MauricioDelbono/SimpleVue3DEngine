import { vec3, quat, mat4 } from 'gl-matrix'
import { Mesh } from '@/models/mesh'
import { Material } from '@/models/material'
import { Entity } from '@/models/entity'
import Textures from '@/helpers/texture'

// glTF 2.0 Interfaces
interface GlTF {
  asset: { version: string }
  scene?: number
  scenes?: { nodes: number[] }[]
  nodes?: GlTFNode[]
  meshes?: GlTFMesh[]
  materials?: GlTFMaterial[]
  textures?: GlTFTexture[]
  images?: GlTFImage[]
  samplers?: GlTFSampler[]
  accessors?: GlTFAccessor[]
  bufferViews?: GlTFBufferView[]
  buffers?: GlTFBuffer[]
}

interface GlTFNode {
  name?: string
  mesh?: number
  children?: number[]
  matrix?: number[]
  translation?: number[]
  rotation?: number[]
  scale?: number[]
}

interface GlTFMesh {
  name?: string
  primitives: {
    attributes: {
      POSITION?: number
      NORMAL?: number
      TEXCOORD_0?: number
    }
    indices?: number
    material?: number
    mode?: number
  }[]
}

interface GlTFMaterial {
  name?: string
  pbrMetallicRoughness?: {
    baseColorFactor?: number[]
    baseColorTexture?: { index: number }
    metallicFactor?: number
    roughnessFactor?: number
    metallicRoughnessTexture?: { index: number }
  }
  emissiveFactor?: number[]
  emissiveTexture?: { index: number }
}

interface GlTFTexture {
  sampler?: number
  source?: number
}

interface GlTFImage {
  bufferView?: number
  mimeType?: string
  uri?: string
}

interface GlTFSampler {
  magFilter?: number
  minFilter?: number
  wrapS?: number
  wrapT?: number
}

interface GlTFAccessor {
  bufferView?: number
  byteOffset?: number
  componentType: number
  count: number
  type: string
  max?: number[]
  min?: number[]
}

interface GlTFBufferView {
  buffer: number
  byteOffset?: number
  byteLength: number
  byteStride?: number
  target?: number
}

interface GlTFBuffer {
  byteLength: number
  uri?: string
}

const COMPONENT_TYPE = {
  5120: Int8Array,
  5121: Uint8Array,
  5122: Int16Array,
  5123: Uint16Array,
  5125: Uint32Array,
  5126: Float32Array,
}

const COMPONENT_SIZE = {
  5120: 1,
  5121: 1,
  5122: 2,
  5123: 2,
  5125: 4,
  5126: 4,
}

const TYPE_SIZE = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16,
}

function quatToEulerDegrees(q: Float32Array | number[]): vec3 {
  const [x, y, z, w] = q
  const out = vec3.create()

  // Roll (x-axis rotation)
  const sinr_cosp = 2 * (w * x + y * z)
  const cosr_cosp = 1 - 2 * (x * x + y * y)
  out[0] = Math.atan2(sinr_cosp, cosr_cosp)

  // Pitch (y-axis rotation)
  const sinp = 2 * (w * y - z * x)
  if (Math.abs(sinp) >= 1)
    out[1] = Math.sign(sinp) * (Math.PI / 2) // use 90 degrees if out of range
  else
    out[1] = Math.asin(sinp)

  // Yaw (z-axis rotation)
  const siny_cosp = 2 * (w * z + x * y)
  const cosy_cosp = 1 - 2 * (y * y + z * z)
  out[2] = Math.atan2(siny_cosp, cosy_cosp)

  // Convert to degrees
  out[0] = out[0] * (180 / Math.PI)
  out[1] = out[1] * (180 / Math.PI)
  out[2] = out[2] * (180 / Math.PI)

  return out
}

export class GLTFLoader {
  private gltf: GlTF | null = null
  private binaryBuffer: ArrayBuffer | null = null
  private buffers: ArrayBuffer[] = []
  private textures: (WebGLTexture | null)[] = []
  private materials: Material[] = []

  constructor() {}

  async load(gl: WebGL2RenderingContext, url: string): Promise<Entity> {
    const response = await fetch(url)
    const arrayBuffer = await response.arrayBuffer()

    return this.parse(gl, arrayBuffer)
  }

  async parse(gl: WebGL2RenderingContext, data: ArrayBuffer): Promise<Entity> {
    const magic = new DataView(data, 0, 4).getUint32(0, true)
    if (magic !== 0x46546c67) {
      throw new Error('Invalid glTF file: Missing magic number')
    }

    const version = new DataView(data, 4, 4).getUint32(0, true)
    if (version !== 2) {
      throw new Error(`Unsupported glTF version: ${version}`)
    }

    const length = new DataView(data, 8, 4).getUint32(0, true)

    let chunkOffset = 12
    let jsonChunk: any = null
    let binaryChunk: ArrayBuffer | null = null

    while (chunkOffset < length) {
      const chunkLength = new DataView(data, chunkOffset, 4).getUint32(0, true)
      const chunkType = new DataView(data, chunkOffset + 4, 4).getUint32(0, true)

      if (chunkType === 0x4e4f534a) { // JSON
        const jsonText = new TextDecoder().decode(new Uint8Array(data, chunkOffset + 8, chunkLength))
        jsonChunk = JSON.parse(jsonText)
      } else if (chunkType === 0x004e4942) { // BIN
        // Use slice to create a new ArrayBuffer for safety (alignment)
        binaryChunk = data.slice(chunkOffset + 8, chunkOffset + 8 + chunkLength)
      }

      chunkOffset += 8 + chunkLength
    }

    if (!jsonChunk) {
      throw new Error('Invalid glTF: Missing JSON chunk')
    }

    this.gltf = jsonChunk as GlTF
    this.binaryBuffer = binaryChunk
    this.buffers = [binaryChunk!]

    // Load Textures
    if (this.gltf.textures) {
      this.textures = await Promise.all(this.gltf.textures.map(async (tex) => {
        if (tex.source !== undefined && this.gltf!.images) {
          const img = this.gltf!.images[tex.source]
          if (img.bufferView !== undefined && this.gltf!.bufferViews) {
            const bufferView = this.gltf!.bufferViews[img.bufferView]
            const buffer = this.buffers[bufferView.buffer]
            const blobPart = buffer.slice(
              (bufferView.byteOffset || 0),
              (bufferView.byteOffset || 0) + bufferView.byteLength
            )
            const blob = new Blob([blobPart], { type: img.mimeType || 'image/png' })
            const url = URL.createObjectURL(blob)
            const texture = await Textures.createTextureFromImage(url)
            URL.revokeObjectURL(url)
            return texture
          }
        }
        return null
      }))
    }

    // Load Materials
    if (this.gltf.materials) {
      this.materials = this.gltf.materials.map(mat => {
        const material = new Material()

        if (mat.pbrMetallicRoughness) {
          const pbr = mat.pbrMetallicRoughness
          if (pbr.baseColorFactor) {
            material.color = vec3.fromValues(pbr.baseColorFactor[0], pbr.baseColorFactor[1], pbr.baseColorFactor[2])
          }
          if (pbr.baseColorTexture && this.textures[pbr.baseColorTexture.index]) {
            material.diffuse = this.textures[pbr.baseColorTexture.index]
          }
          if (pbr.roughnessFactor !== undefined) {
             material.shininess = (1.0 - pbr.roughnessFactor) * 128.0
          }
        }

        if (mat.emissiveTexture && this.textures[mat.emissiveTexture.index]) {
          material.emission = this.textures[mat.emissiveTexture.index]
        }

        return material
      })
    }

    // Process Scene
    const sceneIndex = this.gltf.scene || 0
    const scene = this.gltf.scenes ? this.gltf.scenes[sceneIndex] : null

    const root = new Entity('GLTF_Root')

    if (scene && scene.nodes) {
      for (const nodeIndex of scene.nodes) {
        const entity = this.processNode(nodeIndex)
        root.addChild(entity)
      }
    }

    return root
  }

  private processNode(nodeIndex: number): Entity {
    const node = this.gltf!.nodes![nodeIndex]
    const entity = new Entity(node.name || `Node_${nodeIndex}`)

    if (node.matrix) {
       const mat = mat4.clone(node.matrix as any)
       const pos = vec3.create()
       const rot = quat.create()
       const sca = vec3.create()
       mat4.getTranslation(pos, mat)
       mat4.getRotation(rot, mat)
       mat4.getScaling(sca, mat)

       entity.transform.position = pos
       entity.transform.rotation = quatToEulerDegrees(rot)
       entity.transform.scale = sca
    } else {
      if (node.translation) entity.transform.position = vec3.fromValues(node.translation[0], node.translation[1], node.translation[2])
      if (node.scale) entity.transform.scale = vec3.fromValues(node.scale[0], node.scale[1], node.scale[2])
      if (node.rotation) {
        entity.transform.rotation = quatToEulerDegrees(node.rotation)
      }
    }

    if (node.mesh !== undefined) {
      const meshDef = this.gltf!.meshes![node.mesh]
      if (meshDef.primitives.length === 1) {
        const primitive = meshDef.primitives[0]
        const mesh = this.createMesh(primitive, meshDef.name || `Mesh_${node.mesh}`)
        entity.mesh = mesh
        if (primitive.material !== undefined) {
          entity.setMaterial(this.materials[primitive.material])
        }
      } else {
        meshDef.primitives.forEach((prim, index) => {
          const mesh = this.createMesh(prim, `${meshDef.name}_${index}`)
          const child = new Entity(mesh.name, mesh)
          if (prim.material !== undefined) {
             child.setMaterial(this.materials[prim.material])
          }
          entity.addChild(child)
        })
      }
    }

    if (node.children) {
      for (const childIndex of node.children) {
        entity.addChild(this.processNode(childIndex))
      }
    }

    return entity
  }

  private createMesh(primitive: any, name: string): Mesh {
    const attributes = primitive.attributes
    let positions: Float32Array | number[] = []
    let normals: Float32Array | number[] = []
    let uvs: Float32Array | number[] = []
    let indices: Uint16Array | Uint32Array | number[] = []

    if (attributes.POSITION !== undefined) {
      positions = this.getAccessorData(attributes.POSITION) as Float32Array
    }
    if (attributes.NORMAL !== undefined) {
      normals = this.getAccessorData(attributes.NORMAL) as Float32Array
    }
    if (attributes.TEXCOORD_0 !== undefined) {
      uvs = this.getAccessorData(attributes.TEXCOORD_0) as Float32Array
    }
    if (primitive.indices !== undefined) {
      indices = this.getAccessorData(primitive.indices) as Uint16Array | Uint32Array
    }

    return new Mesh(name, positions, normals, uvs, indices)
  }

  private getAccessorData(accessorIndex: number): TypedArray {
    const accessor = this.gltf!.accessors![accessorIndex]
    const bufferView = this.gltf!.bufferViews![accessor.bufferView!]
    const buffer = this.buffers[bufferView.buffer]

    const componentType = accessor.componentType as keyof typeof COMPONENT_TYPE
    const TypedArrayConstructor = COMPONENT_TYPE[componentType]
    const componentSize = COMPONENT_SIZE[componentType]
    const typeSize = TYPE_SIZE[accessor.type as keyof typeof TYPE_SIZE]

    const byteOffset = (bufferView.byteOffset || 0) + (accessor.byteOffset || 0)

    // Create a slice to ensure alignment and safety
    const byteLength = accessor.count * typeSize * componentSize
    const bufferSlice = buffer.slice(byteOffset, byteOffset + byteLength)

    return new TypedArrayConstructor(bufferSlice)
  }
}

type TypedArray = Int8Array | Uint8Array | Int16Array | Uint16Array | Uint32Array | Float32Array
