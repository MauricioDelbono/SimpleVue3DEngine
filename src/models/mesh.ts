export class Mesh {
  public name: string
  public positions: number[]
  public normals: number[]
  public textureCoords: number[]
  public indices: number[]

  public vaoMap: Record<string, WebGLVertexArrayObject | null>

  constructor(name: string, positions: number[] = [], normals: number[] = [], textureCoords: number[] = [], indices: number[] = []) {
    this.name = name
    this.positions = positions
    this.normals = normals
    this.textureCoords = textureCoords
    this.indices = indices

    this.vaoMap = {}
  }

  // public render() {
  //   if (this.vao) {
  //     gl.bindVertexArray(this.vao)
  //     gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0)
  //     gl.bindVertexArray(null)
  //   }
  // }

  // public renderDepth() {
  //   if (this.vao) {
  //     gl.bindVertexArray(this.vao)
  //     gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0)
  //     gl.bindVertexArray(null)
  //   }
  // }

  // public renderShadow() {
  //   if (this.vao) {
  //     gl.bindVertexArray(this.vao)
  //     gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_SHORT, 0)
  //     gl.bindVertexArray(null)
  //   }
  // }
}
