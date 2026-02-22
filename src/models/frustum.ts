import { mat4, vec3, vec4 } from 'gl-matrix'

export class Frustum {
  public planes: vec4[] = []

  constructor() {
    for (let i = 0; i < 6; i++) {
      this.planes.push(vec4.create())
    }
  }

  public setFromMatrix(m: mat4) {
    // Left
    vec4.set(this.planes[0], m[3] + m[0], m[7] + m[4], m[11] + m[8], m[15] + m[12])
    // Right
    vec4.set(this.planes[1], m[3] - m[0], m[7] - m[4], m[11] - m[8], m[15] - m[12])
    // Bottom
    vec4.set(this.planes[2], m[3] + m[1], m[7] + m[5], m[11] + m[9], m[15] + m[13])
    // Top
    vec4.set(this.planes[3], m[3] - m[1], m[7] - m[5], m[11] - m[9], m[15] - m[13])
    // Near
    vec4.set(this.planes[4], m[3] + m[2], m[7] + m[6], m[11] + m[10], m[15] + m[14])
    // Far
    vec4.set(this.planes[5], m[3] - m[2], m[7] - m[6], m[11] - m[10], m[15] - m[14])

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
      const pX = plane[0] > 0 ? max[0] : min[0]
      const pY = plane[1] > 0 ? max[1] : min[1]
      const pZ = plane[2] > 0 ? max[2] : min[2]

      const distance = plane[0] * pX + plane[1] * pY + plane[2] * pZ + plane[3]

      if (distance < 0) {
        return false
      }
    }
    return true
  }
}
