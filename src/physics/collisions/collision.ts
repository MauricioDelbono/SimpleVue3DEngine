import type { Rigidbody } from '../dynamics/rigidBody'
import type { CollisionPoints } from './collisionPoints'

export class Collision {
  public entityA: Rigidbody
  public entityB: Rigidbody
  public points: CollisionPoints

  constructor(entityA: Rigidbody, entityB: Rigidbody, points: CollisionPoints) {
    this.entityA = entityA
    this.entityB = entityB
    this.points = points
  }
}
