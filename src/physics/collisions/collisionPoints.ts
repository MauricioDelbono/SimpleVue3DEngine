import { vec3 } from 'gl-matrix'

export class CollisionPoints {
  // Furthest point of A into B
  public a: vec3 = vec3.fromValues(0, 0, 0)
  // Furthest point of B into A
  public b: vec3 = vec3.fromValues(0, 0, 0)
  // B – A normalized
  public normal: vec3 = vec3.fromValues(0, 0, 0)
  // Length of B – A
  public depth: number = 0
  public hasCollision: boolean = false

  constructor(a: vec3, b: vec3, normal: vec3, depth: number) {
    this.a = a
    this.b = b
    this.normal = normal
    this.depth = depth
    this.hasCollision = depth >= 0
  }
}
