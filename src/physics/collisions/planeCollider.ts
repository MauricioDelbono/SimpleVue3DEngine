import { vec3 } from 'gl-matrix'
import { Collider } from './collider'
import type { SphereCollider } from './sphereCollider'
import CollisionsHelper from '../helpers/collisions'
import type { CollisionPoints } from './collisionPoints'

export class PlaneCollider extends Collider {
  public plane: vec3 = vec3.create()
  public distance: number = 0

  constructor(plane: vec3, distance: number) {
    super()
    this.plane = plane
    this.distance = distance
  }

  public testSphereCollision(collider: SphereCollider): CollisionPoints {
    return CollisionsHelper.getPlaneSphereCollision(this, collider)
  }

  public testPlaneCollision(collider: PlaneCollider): CollisionPoints {
    throw new Error('Collision between planes not supported.')
  }
}
