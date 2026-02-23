import { mat4, vec3, vec4 } from 'gl-matrix'

export class Frustum {
  // 6 planes: Left, Right, Bottom, Top, Near, Far
  // Each plane is vec4 (nx, ny, nz, d)
  public planes: vec4[] = []

  constructor() {
    for (let i = 0; i < 6; i++) {
      this.planes.push(vec4.create())
    }
  }

  public setFromProjectionMatrix(m: mat4) {
    const planes = this.planes

    // Left
    planes[0][0] = m[3] + m[0]
    planes[0][1] = m[7] + m[4]
    planes[0][2] = m[11] + m[8]
    planes[0][3] = m[15] + m[12]

    // Right
    planes[1][0] = m[3] - m[0]
    planes[1][1] = m[7] - m[4]
    planes[1][2] = m[11] - m[8]
    planes[1][3] = m[15] - m[12]

    // Bottom
    planes[2][0] = m[3] + m[1]
    planes[2][1] = m[7] + m[5]
    planes[2][2] = m[11] + m[9]
    planes[2][3] = m[15] + m[13]

    // Top
    planes[3][0] = m[3] - m[1]
    planes[3][1] = m[7] - m[5]
    planes[3][2] = m[11] - m[9]
    planes[3][3] = m[15] - m[13]

    // Near
    planes[4][0] = m[3] + m[2]
    planes[4][1] = m[7] + m[6]
    planes[4][2] = m[11] + m[10]
    planes[4][3] = m[15] + m[14]

    // Far
    planes[5][0] = m[3] - m[2]
    planes[5][1] = m[7] - m[6]
    planes[5][2] = m[11] - m[10]
    planes[5][3] = m[15] - m[14]

    // Normalize planes
    for (let i = 0; i < 6; i++) {
      const p = planes[i]
      const len = Math.sqrt(p[0] * p[0] + p[1] * p[1] + p[2] * p[2])
      if (len > 0) {
        const invLen = 1.0 / len
        p[0] *= invLen
        p[1] *= invLen
        p[2] *= invLen
        p[3] *= invLen
      }
    }
  }

  /**
   * Checks if an AABB is visible (intersects or inside the frustum).
   * @param min Min point of AABB
   * @param max Max point of AABB
   * @returns true if visible
   */
  public intersectsBox(min: vec3, max: vec3): boolean {
    const planes = this.planes

    for (let i = 0; i < 6; i++) {
      const p = planes[i]

      // Check positive vertex (p-vertex) relative to plane normal.
      // The p-vertex is the corner of the AABB that is furthest in the direction of the normal.
      // If dot(normal, p-vertex) + d < 0, then the entire box is behind the plane (outside).

      const px = p[0] > 0 ? max[0] : min[0]
      const py = p[1] > 0 ? max[1] : min[1]
      const pz = p[2] > 0 ? max[2] : min[2]

      if (p[0] * px + p[1] * py + p[2] * pz + p[3] < 0) {
        return false // Outside this plane
      }
    }

    return true
  }
}
