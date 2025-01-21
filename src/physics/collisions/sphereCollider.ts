import { mat3, vec3 } from 'gl-matrix'
import { Collider } from './collider'
import type { CollisionPoints } from './collisionPoints'
import CollisionsHelper from '../helpers/collisions'
import { PlaneCollider } from './planeCollider'

export class SphereCollider extends Collider {
  public radius: number = 1

  constructor(center: vec3, radius: number) {
    super()
    this.center = center
    this.radius = radius
  }

  public testCollision<T extends Collider>(collider: T): CollisionPoints {
    switch (collider.constructor) {
      case PlaneCollider:
        return this.testPlaneCollision(collider as unknown as PlaneCollider)
      case SphereCollider:
        return this.testSphereCollision(collider as unknown as SphereCollider)
      default:
        throw new Error('Collider not supported')
    }
  }

  public testSphereCollision(collider: SphereCollider): CollisionPoints {
    return CollisionsHelper.getSphereSphereCollision(this, collider)
  }

  public testPlaneCollision(collider: PlaneCollider): CollisionPoints {
    return CollisionsHelper.getSpherePlaneCollision(this, collider)
  }

  public get min(): vec3 {
    const worldCenter = this.entity.transform.toWorldSpace(this.center)
    const worldMin = vec3.subtract(vec3.create(), worldCenter, vec3.fromValues(this.radius, this.radius, this.radius))
    return worldMin
  }

  public get max(): vec3 {
    const worldCenter = this.entity.transform.toWorldSpace(this.center)
    const worldMax = vec3.add(vec3.create(), worldCenter, vec3.fromValues(this.radius, this.radius, this.radius))
    return worldMax
  }

  public calculateInertiaTensor(mass: number): mat3 {
    const inertiaTensor = mat3.create()
    const coefficient = (2 / 5) * mass * this.radius * this.radius
    mat3.set(inertiaTensor, coefficient, 0, 0, 0, coefficient, 0, 0, 0, coefficient)
    return inertiaTensor
  }

  public getInertiaTensor(mass: number): number {
    return (2 / 5) * mass * this.radius * this.radius
  }
}
