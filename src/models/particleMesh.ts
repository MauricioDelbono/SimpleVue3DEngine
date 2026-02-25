import { Mesh } from './mesh'
import Primitives from '@/helpers/primitives'

export class ParticleMesh extends Mesh {
  public instanceData: Float32Array
  public maxParticles: number
  public activeCount: number = 0
  public instanceBuffer: WebGLBuffer | null = null

  // Layout:
  // 0-2: Position (vec3)
  // 3-5: Velocity (vec3)
  // 6: Life (float)
  // 7: MaxLife (float)
  // 8: Size (float)
  // 9-12: Color (vec4: r, g, b, a)
  // Stride: 13 floats

  constructor(maxParticles: number = 1000) {
    const quad = Primitives.createXYQuad()
    super('ParticleMesh', quad.positions, quad.normals, quad.textureCoords, quad.indices)
    this.maxParticles = maxParticles
    this.instanceData = new Float32Array(maxParticles * 13)
  }
}
