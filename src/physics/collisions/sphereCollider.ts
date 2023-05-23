import { vec3 } from 'gl-matrix'
import { Collider } from './collider'
import type { CollisionPoints } from './collisionPoints'
import CollisionsHelper from '../helpers/collisions'
import { PlaneCollider } from './planeCollider'

export class SphereCollider extends Collider {
  public center: vec3 = vec3.create()
  public radius: number = 1

  constructor(center: vec3, radius: number) {
    super()
    this.center = center
    this.radius = radius
  }

  public testSphereCollision(collider: SphereCollider): CollisionPoints {
    return CollisionsHelper.getSphereSphereCollision(this, collider)
  }

  public testPlaneCollision(collider: PlaneCollider): CollisionPoints {
    return CollisionsHelper.getSpherePlaneCollision(this, collider)
  }
}
