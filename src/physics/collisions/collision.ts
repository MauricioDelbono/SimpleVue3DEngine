import type { Rigidbody } from '../dynamics/rigidBody'
import type { Collider } from './collider'
import type { CollisionPoints } from './collisionPoints'

export class Collision {
  public bodyA: Rigidbody
  public bodyB: Rigidbody
  public colliderA: Collider
  public colliderB: Collider
  public points: CollisionPoints

  constructor(bodyA: Rigidbody, bodyB: Rigidbody, colliderA: Collider, colliderB: Collider, points: CollisionPoints) {
    this.bodyA = bodyA
    this.bodyB = bodyB
    this.colliderA = colliderA
    this.colliderB = colliderB
    this.points = points
  }
}
