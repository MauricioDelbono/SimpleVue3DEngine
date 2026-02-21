import { vec3 } from 'gl-matrix'

export class Face {
  public indices: Array<number>
  public vertices: Array<vec3>
  public adjacents: Array<number>
  public normal: vec3
  public distance: number
  public valid: boolean

  constructor(indices: Array<number>, vertices: Array<vec3>, adjacents: Array<number> = [-1, -1, -1]) {
    this.indices = indices // [i1, i2, i3]
    this.vertices = [vertices[indices[0]], vertices[indices[1]], vertices[indices[2]]]
    this.adjacents = adjacents // Indices of adjacent faces [opp i1-i2, opp i2-i3, opp i3-i1]
    this.normal = this.computeNormal()
    this.distance = this.computeDistance()
    this.valid = this.isValid()
  }

  computeNormal() {
    const [a, b, c] = this.vertices
    const ab = vec3.subtract(vec3.create(), b, a)
    const ac = vec3.subtract(vec3.create(), c, a)
    const result = vec3.cross(vec3.create(), ab, ac)
    return vec3.normalize(result, result)
  }

  computeDistance() {
    return vec3.dot(this.normal, this.vertices[0])
  }

  isValid() {
    return vec3.length(this.normal) > 1e-6
  }

  isVisible(point: vec3) {
    const ap = vec3.subtract(vec3.create(), point, this.vertices[0])
    return vec3.dot(this.normal, ap) > 0
  }

  getCentroid() {
    const [a, b, c] = this.vertices
    const result = vec3.create()
    vec3.add(result, a, b)
    vec3.add(result, result, c)
    vec3.scale(result, result, 1 / 3)
    return result
  }
}
