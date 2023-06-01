import { vec3 } from 'gl-matrix'
import { Collider } from './collider'
import type { CollisionPoints } from './collisionPoints'
import CollisionsHelper from '../helpers/collisions'
import { PlaneCollider } from './planeCollider'

export class SphereCollider extends Collider {
  // public center: vec3 = vec3.create()
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
}
