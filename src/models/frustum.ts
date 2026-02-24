import { mat4, vec3, vec4 } from 'gl-matrix'

export class Frustum {
  private planes: vec4[] = []

  constructor() {
    for (let i = 0; i < 6; i++) {
      this.planes.push(vec4.create())
    }
  }

  public setFromProjectionMatrix(m: mat4) {
    // Left
    this.planes[0][0] = m[3] + m[0]
    this.planes[0][1] = m[7] + m[4]
    this.planes[0][2] = m[11] + m[8]
    this.planes[0][3] = m[15] + m[12]

    // Right
    this.planes[1][0] = m[3] - m[0]
    this.planes[1][1] = m[7] - m[4]
    this.planes[1][2] = m[11] - m[8]
    this.planes[1][3] = m[15] - m[12]

    // Bottom
    this.planes[2][0] = m[3] + m[1]
    this.planes[2][1] = m[7] + m[5]
    this.planes[2][2] = m[11] + m[9]
    this.planes[2][3] = m[15] + m[13]

    // Top
    this.planes[3][0] = m[3] - m[1]
    this.planes[3][1] = m[7] - m[5]
    this.planes[3][2] = m[11] - m[9]
    this.planes[3][3] = m[15] - m[13]

    // Near
    this.planes[4][0] = m[3] + m[2]
    this.planes[4][1] = m[7] + m[6]
    this.planes[4][2] = m[11] + m[10]
    this.planes[4][3] = m[15] + m[14]

    // Far
    this.planes[5][0] = m[3] - m[2]
    this.planes[5][1] = m[7] - m[6]
    this.planes[5][2] = m[11] - m[10]
    this.planes[5][3] = m[15] - m[14]

    // Normalize planes
    for (let i = 0; i < 6; i++) {
      const plane = this.planes[i]
      const length = Math.sqrt(plane[0] * plane[0] + plane[1] * plane[1] + plane[2] * plane[2])
      if (length > 0) {
        vec4.scale(plane, plane, 1 / length)
      }
    }
  }

  public intersectsAABB(min: vec3, max: vec3): boolean {
    for (let i = 0; i < 6; i++) {
      const plane = this.planes[i]

      const x = plane[0] > 0 ? max[0] : min[0]
      const y = plane[1] > 0 ? max[1] : min[1]
      const z = plane[2] > 0 ? max[2] : min[2]

      if (x * plane[0] + y * plane[1] + z * plane[2] + plane[3] < 0) {
        return false
      }
    }
    return true
  }
}
