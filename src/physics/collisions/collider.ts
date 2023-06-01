import { Component } from '@/models/component'
import { PlaneCollider } from './planeCollider'
import { SphereCollider } from './sphereCollider'
import type { CollisionPoints } from './collisionPoints'
import { vec3 } from 'gl-matrix'

export class Collider extends Component {
  public center: vec3 = vec3.create()

  public get worldPosition() {
    const worldPos = vec3.create()
    vec3.add(worldPos, this.entity.transform.worldPosition, this.center)
    return worldPos
  }

  public testCollision<T extends Collider>(collider: T): CollisionPoints {
    throw new Error('Not implemented in base class')
  }

  // public testCollision<T extends Collider>(collider: T): CollisionPoints {
  //   switch (collider.constructor) {
  //     case PlaneCollider:
  //       return this.testPlaneCollision(collider as unknown as PlaneCollider)
  //     case SphereCollider:
  //       return this.testSphereCollision(collider as unknown as SphereCollider)
  //     default:
  //       throw new Error('Collider not supported')
  //   }
  // }
  // public testPlaneCollision(collider: PlaneCollider): CollisionPoints {
  //   throw new Error('Not implemented in base class')
  // }
  // public testSphereCollision(collider: SphereCollider): CollisionPoints {
  //   throw new Error('Not implemented in base class')
  // }
}
