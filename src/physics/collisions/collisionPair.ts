import type { Rigidbody } from '../dynamics/rigidBody'
import type { Collider } from './collider'

export class CollisionPair {
  public bodyA: Rigidbody
  public bodyB: Rigidbody
  public colliderA: Collider
  public colliderB: Collider

  constructor(bodyA: Rigidbody, bodyB: Rigidbody, colliderA: Collider, colliderB: Collider) {
    this.bodyA = bodyA
    this.bodyB = bodyB
    this.colliderA = colliderA
    this.colliderB = colliderB
  }
}
