import type { Rigidbody } from '../dynamics/rigidBody'
import type { Collider } from './collider'

export class CollisionPair {
  public entityA: Rigidbody
  public entityB: Rigidbody
  public colliderA: Collider
  public colliderB: Collider

  constructor(entityA: Rigidbody, entityB: Rigidbody, colliderA: Collider, colliderB: Collider) {
    this.entityA = entityA
    this.entityB = entityB
    this.colliderA = colliderA
    this.colliderB = colliderB
  }
}
