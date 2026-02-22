import { vec3 } from 'gl-matrix'

export class Mesh {
  public name: string
  public positions: number[] | Float32Array
  public normals: number[] | Float32Array
  public textureCoords: number[] | Float32Array
  public indices: number[] | Uint16Array | Uint32Array
  public vertices: vec3[] = []

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
      this.vertices.push(vec3.fromValues(positions[i], positions[i + 1], positions[i + 2]))
    }

    this.vaoMap = {}
  }
}
