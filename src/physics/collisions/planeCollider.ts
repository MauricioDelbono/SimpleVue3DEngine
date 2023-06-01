import { vec3 } from 'gl-matrix'
import { Collider } from './collider'
import CollisionsHelper from '../helpers/collisions'
import { SphereCollider } from './sphereCollider'
import type { CollisionPoints } from './collisionPoints'

export class PlaneCollider extends Collider {
  public plane: vec3 = vec3.create()
  public distance: number = 0

  constructor(plane: vec3, distance: number) {
    super()
    this.plane = plane
    this.distance = distance
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
    return CollisionsHelper.getPlaneSphereCollision(this, collider)
  }

  public testPlaneCollision(collider: PlaneCollider): CollisionPoints {
    throw new Error('Collision between planes not supported.')
  }
}
