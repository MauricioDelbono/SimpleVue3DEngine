import { vec3 } from 'gl-matrix'

export class Mesh {
  public name: string
  public positions: number[]
  public normals: number[]
  public textureCoords: number[]
  public indices: number[]
  public vertices: vec3[] = []

  public min: vec3 = vec3.fromValues(Infinity, Infinity, Infinity)
  public max: vec3 = vec3.fromValues(-Infinity, -Infinity, -Infinity)

  public vaoMap: Record<string, WebGLVertexArrayObject | null>

  constructor(name: string, positions: number[] = [], normals: number[] = [], textureCoords: number[] = [], indices: number[] = []) {
    this.name = name
    this.positions = positions
    this.normals = normals
    this.textureCoords = textureCoords
    this.indices = indices

    if (positions.length === 0) {
      vec3.set(this.min, 0, 0, 0)
      vec3.set(this.max, 0, 0, 0)
    }

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i]
      const y = positions[i + 1]
      const z = positions[i + 2]
      this.vertices.push(vec3.fromValues(x, y, z))

      if (x < this.min[0]) this.min[0] = x
      if (y < this.min[1]) this.min[1] = y
      if (z < this.min[2]) this.min[2] = z

      if (x > this.max[0]) this.max[0] = x
      if (y > this.max[1]) this.max[1] = y
      if (z > this.max[2]) this.max[2] = z
    }

    this.vaoMap = {}
  }
}
