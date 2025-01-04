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
    const localMin = vec3.subtract(vec3.create(), this.center, vec3.fromValues(this.radius, this.radius, this.radius))
    return this.entity.transform.toWorldSpace(localMin)
  }

  public get max(): vec3 {
    const localMax = vec3.add(vec3.create(), this.center, vec3.fromValues(this.radius, this.radius, this.radius))
    return this.entity.transform.toWorldSpace(localMax)
  }

  public calculateInertiaTensor(mass: number): mat3 {
    const inertiaTensor = mat3.create()
    const coefficient = (2 / 5) * mass * this.radius * this.radius
    mat3.set(inertiaTensor, coefficient, 0, 0, 0, coefficient, 0, 0, 0, coefficient)
    return inertiaTensor
  }
}
