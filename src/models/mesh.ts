import { vec3 } from 'gl-matrix'
import { AABB } from './aabb'

export class Mesh {
  public name: string
  public positions: number[] | Float32Array
  public normals: number[] | Float32Array
  public textureCoords: number[] | Float32Array
  public indices: number[] | Uint16Array | Uint32Array
  public vertices: vec3[] = []
  public aabb: AABB

  public vaoMap: Record<string, WebGLVertexArrayObject | null>

  constructor(
    name: string,
    positions: number[] | Float32Array = [],
    normals: number[] | Float32Array = [],
    textureCoords: number[] | Float32Array = [],
    indices: number[] | Uint16Array | Uint32Array = []
  ) {
    this.name = name
    this.positions = positions
    this.normals = normals
    this.textureCoords = textureCoords
    this.indices = indices

    const min = vec3.fromValues(Infinity, Infinity, Infinity)
    const max = vec3.fromValues(-Infinity, -Infinity, -Infinity)

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i]
      const y = positions[i + 1]
      const z = positions[i + 2]
      this.vertices.push(vec3.fromValues(x, y, z))

      if (x < min[0]) min[0] = x
      if (y < min[1]) min[1] = y
      if (z < min[2]) min[2] = z
      if (x > max[0]) max[0] = x
      if (y > max[1]) max[1] = y
      if (z > max[2]) max[2] = z
    }

    this.aabb = new AABB(min, max)
    this.vaoMap = {}
  }
}
