import { vec3 } from 'gl-matrix'
import { Collider } from './collider'
import type { CollisionPoints } from './collisionPoints'
import { PlaneCollider } from './planeCollider'
import { SphereCollider } from './sphereCollider'
import CollisionsHelper from '../helpers/collisions'

export class BoxCollider extends Collider {
  public size: vec3 = vec3.fromValues(1, 1, 1)

  constructor(center: vec3) {
    super()
    this.center = center
  }

  public get min(): vec3 {
    return vec3.subtract(vec3.create(), this.center, vec3.scale(vec3.create(), this.size, 0.5))
  }

  public get max(): vec3 {
    return vec3.add(vec3.create(), this.center, vec3.scale(vec3.create(), this.size, 0.5))
  }

  public testCollision<T extends Collider>(collider: T): CollisionPoints {
    switch (collider.constructor) {
      case BoxCollider:
        return this.testBoxCollision(collider as unknown as BoxCollider)
      case PlaneCollider:
        return this.testPlaneCollision(collider as unknown as PlaneCollider)
      case SphereCollider:
        return this.testSphereCollision(collider as unknown as SphereCollider)
      default:
        throw new Error('Collider not supported')
    }
  }

  public testBoxCollision(collider: BoxCollider): CollisionPoints {
    return CollisionsHelper.getBoxBoxCollision(this, collider)
  }

  public testSphereCollision(collider: SphereCollider): CollisionPoints {
    return CollisionsHelper.getBoxSphereCollision(this, collider)
  }

  public testPlaneCollision(collider: PlaneCollider): CollisionPoints {
    return CollisionsHelper.getBoxPlaneCollision(this, collider)
  }
}
