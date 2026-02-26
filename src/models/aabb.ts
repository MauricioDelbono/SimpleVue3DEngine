import { vec3, mat4 } from 'gl-matrix'

export class AABB {
  public min: vec3
  public max: vec3

  constructor(min: vec3 = vec3.fromValues(Infinity, Infinity, Infinity), max: vec3 = vec3.fromValues(-Infinity, -Infinity, -Infinity)) {
    this.min = min
    this.max = max
  }

  public getCenter(): vec3 {
    const center = vec3.create()
    vec3.add(center, this.min, this.max)
    vec3.scale(center, center, 0.5)
    return center
  }

  public getSize(): vec3 {
    const size = vec3.create()
    vec3.subtract(size, this.max, this.min)
    return size
  }

  public static transform(aabb: AABB, matrix: mat4): AABB {
    const corners = [
      vec3.fromValues(aabb.min[0], aabb.min[1], aabb.min[2]),
      vec3.fromValues(aabb.min[0], aabb.min[1], aabb.max[2]),
      vec3.fromValues(aabb.min[0], aabb.max[1], aabb.min[2]),
      vec3.fromValues(aabb.min[0], aabb.max[1], aabb.max[2]),
      vec3.fromValues(aabb.max[0], aabb.min[1], aabb.min[2]),
      vec3.fromValues(aabb.max[0], aabb.min[1], aabb.max[2]),
      vec3.fromValues(aabb.max[0], aabb.max[1], aabb.min[2]),
      vec3.fromValues(aabb.max[0], aabb.max[1], aabb.max[2])
    ]

    const newMin = vec3.fromValues(Infinity, Infinity, Infinity)
    const newMax = vec3.fromValues(-Infinity, -Infinity, -Infinity)

    for (const corner of corners) {
      vec3.transformMat4(corner, corner, matrix)
      vec3.min(newMin, newMin, corner)
      vec3.max(newMax, newMax, corner)
    }

    return new AABB(newMin, newMax)
  }
}
