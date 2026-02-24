import { vec3 } from 'gl-matrix'

export class Mesh {
  public name: string
  public positions: number[] | Float32Array
  public normals: number[] | Float32Array
  public textureCoords: number[] | Float32Array
  public indices: number[] | Uint16Array | Uint32Array
  public vertices: vec3[] = []

  public localMin: vec3 = vec3.fromValues(Infinity, Infinity, Infinity)
  public localMax: vec3 = vec3.fromValues(-Infinity, -Infinity, -Infinity)

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

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i]
      const y = positions[i + 1]
      const z = positions[i + 2]
      this.vertices.push(vec3.fromValues(x, y, z))

      if (x < this.localMin[0]) this.localMin[0] = x
      if (y < this.localMin[1]) this.localMin[1] = y
      if (z < this.localMin[2]) this.localMin[2] = z

      if (x > this.localMax[0]) this.localMax[0] = x
      if (y > this.localMax[1]) this.localMax[1] = y
      if (z > this.localMax[2]) this.localMax[2] = z
    }

    if (positions.length === 0) {
      vec3.set(this.localMin, 0, 0, 0)
      vec3.set(this.localMax, 0, 0, 0)
    }

    this.vaoMap = {}
  }
}
