import type { Rigidbody } from '../dynamics/rigidBody'
import type { Collider } from './collider'
import { Manifold } from './manifold'

export class Collision {
  public bodyA: Rigidbody
  public bodyB: Rigidbody
  public colliderA: Collider
  public colliderB: Collider
  public manifold: Manifold

  constructor(bodyA: Rigidbody, bodyB: Rigidbody, colliderA: Collider, colliderB: Collider, manifold: Manifold) {
    this.bodyA = bodyA
    this.bodyB = bodyB
    this.colliderA = colliderA
    this.colliderB = colliderB
    this.manifold = manifold
  }
}
