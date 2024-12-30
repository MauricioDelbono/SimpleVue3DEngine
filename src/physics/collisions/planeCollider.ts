import { vec3 } from 'gl-matrix'
import { Collider } from './collider'
import CollisionsHelper from '../helpers/collisions'
import { SphereCollider } from './sphereCollider'
import type { CollisionPoints } from './collisionPoints'

export class PlaneCollider extends Collider {
  public planeNormal: vec3 = vec3.create()

  constructor(planeNormal: vec3) {
    super()
    this.planeNormal = planeNormal
  }

  public get min(): vec3 {
    const min = vec3.fromValues(Infinity, Infinity, Infinity)

    this.entity.mesh.vertices.forEach((vertex) => {
      vec3.min(min, min, this.entity.transform.toWorldSpace(vertex))
    })

    return min
  }

  public get max(): vec3 {
    const max = vec3.fromValues(-Infinity, -Infinity, -Infinity)

    this.entity.mesh.vertices.forEach((vertex) => {
      vec3.max(max, max, this.entity.transform.toWorldSpace(vertex))
    })

    return max
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
    return CollisionsHelper.getSpherePlaneCollision(collider, this)
  }

  public testPlaneCollision(collider: PlaneCollider): CollisionPoints {
    throw new Error('Collision between planes not supported.')
  }
}
