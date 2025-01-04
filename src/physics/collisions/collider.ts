import { Component } from '@/models/component'
import type { CollisionPoints } from './collisionPoints'
import { mat3, vec3 } from 'gl-matrix'

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

  public get min(): vec3 {
    throw new Error('Not implemented in base class')
  }

  public get max(): vec3 {
    throw new Error('Not implemented in base class')
  }

  public intersects(collider: Collider): boolean {
    const overlapX = this.min[0] <= collider.max[0] && this.max[0] >= collider.min[0]
    const overlapY = this.min[1] <= collider.max[1] && this.max[1] >= collider.min[1]
    const overlapZ = this.min[2] <= collider.max[2] && this.max[2] >= collider.min[2]

    return overlapX && overlapY && overlapZ
  }

  public calculateInertiaTensor(mass: number): mat3 {
    throw new Error('Not implemented in base class')
  }
}
