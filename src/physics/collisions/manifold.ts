import { vec3 } from 'gl-matrix'

export class ContactPoint {
  public a: vec3 = vec3.create()
  public b: vec3 = vec3.create()
  public normal: vec3 = vec3.create()
  public depth: number = 0

  constructor(a: vec3, b: vec3, normal: vec3, depth: number) {
    vec3.copy(this.a, a)
    vec3.copy(this.b, b)
    vec3.copy(this.normal, normal)
    this.depth = depth
  }
}

export class Manifold {
  public points: ContactPoint[] = []
  public sharedNormal: vec3 = vec3.create()

  constructor(sharedNormal: vec3) {
    vec3.copy(this.sharedNormal, sharedNormal)
  }

  public addPoint(a: vec3, b: vec3, depth: number) {
    this.points.push(new ContactPoint(a, b, this.sharedNormal, depth))
  }

  public get hasCollision(): boolean {
    return this.points.length > 0
  }
}
