import { vec3 } from 'gl-matrix'
import type { Collision } from '../collisions/collision'
import { Solver } from './solver'
import type { Time } from '@/models/time'

export class ImpulseSolver extends Solver {
  private baumgarte: number = 0.01 // Further reduced from 0.05 to minimize bouncing
  private slop: number = 0.02 // Increased to match PositionSolver
  private contactCache: Map<string, { normalImpulse: number; tangentImpulse: vec3 }> = new Map()

  public solve(collisions: Collision[], time: Time) {
    collisions.forEach((collision) => {
      this.solveCollision(collision, time)
    })

    // Clear old contact cache entries (simple cleanup)
    if (this.contactCache.size > 100) {
      this.contactCache.clear()
    }
  }

  public solveCollision(collision: Collision, time: Time) {
    const manifold = collision.manifold
    if (!manifold.hasCollision) return

    // Wake up any sleeping objects involved in collision
    if (collision.bodyA.isSleeping) collision.bodyA.wakeUp()
    if (collision.bodyB.isSleeping) collision.bodyB.wakeUp()

    const totalImpulseA = vec3.create()
    const totalTorqueA = vec3.create()
    const totalImpulseB = vec3.create()
    const totalTorqueB = vec3.create()

    manifold.points?.forEach((point) => {
      const rA = vec3.subtract(vec3.create(), point.a, collision.bodyA.position)
      const rB = vec3.subtract(vec3.create(), point.b, collision.bodyB.position)

      const vrA = vec3.add(vec3.create(), collision.bodyA.velocity, vec3.cross(vec3.create(), collision.bodyA.angularVelocity, rA))
      const vrB = vec3.add(vec3.create(), collision.bodyB.velocity, vec3.cross(vec3.create(), collision.bodyB.angularVelocity, rB))
      const vr = vec3.subtract(vec3.create(), vrB, vrA)
      const normalVelocity = vec3.dot(vr, point.normal)

      const tangent = vec3.subtract(vec3.create(), vr, vec3.scale(vec3.create(), point.normal, normalVelocity))
      const tangentNormalized = vec3.length(tangent) > 0 ? vec3.normalize(vec3.create(), tangent) : vec3.create()
      const vt = vec3.dot(vr, tangentNormalized)

      const restitution = Math.min(collision.bodyA.restitution, collision.bodyB.restitution)

      const mA = collision.bodyA.inverseMass
      const mB = collision.bodyB.inverseMass
      const iA = collision.bodyA.inverseInertiaTensor
      const iB = collision.bodyB.inverseInertiaTensor

      const rnA = vec3.cross(vec3.create(), rA, point.normal)
      const rnB = vec3.cross(vec3.create(), rB, point.normal)
      const kNormal = mA + mB + vec3.dot(vec3.scale(vec3.create(), rnA, iA), rnA) + vec3.dot(vec3.scale(vec3.create(), rnB, iB), rnB)
      const normalMass = kNormal > 0 ? 1 / kNormal : 0

      const rtA = vec3.cross(vec3.create(), rA, tangentNormalized)
      const rtB = vec3.cross(vec3.create(), rB, tangentNormalized)
      const kTangent = mA + mB + vec3.dot(vec3.scale(vec3.create(), rtA, iA), rtA) + vec3.dot(vec3.scale(vec3.create(), rtB, iB), rtB)
      const tangentMass = kTangent > 0 ? 1 / kTangent : 0

      let bias = 0
      if (point.depth > this.slop) {
        bias = (this.baumgarte / time.deltaSeconds) * (point.depth - this.slop)
      }

      // Only apply restitution if objects are approaching (negative relative velocity)
      const restitution_bias = normalVelocity < 0 ? -restitution * normalVelocity : 0
      const total_bias = bias + restitution_bias
      let lambda = normalMass * (total_bias - normalVelocity)
      lambda = Math.max(lambda, 0) // Clamp to non-negative

      const impulse = vec3.scale(vec3.create(), point.normal, lambda)

      const maxStaticFrictionImpulse = Math.sqrt(collision.bodyA.staticFriction * collision.bodyB.staticFriction) * lambda
      const maxDynamicFrictionImpulse = Math.sqrt(collision.bodyA.dynamicFriction * collision.bodyB.dynamicFriction) * lambda
      let tangentImpulseScalar = -vt * tangentMass
      if (Math.abs(tangentImpulseScalar) > maxStaticFrictionImpulse) {
        tangentImpulseScalar = Math.sign(tangentImpulseScalar) * maxDynamicFrictionImpulse
      }
      const tangentImpulse = vec3.scale(vec3.create(), tangentNormalized, tangentImpulseScalar)

      const pointImpulse = vec3.add(vec3.create(), impulse, tangentImpulse)

      vec3.add(totalImpulseA, totalImpulseA, vec3.scale(vec3.create(), pointImpulse, -1))
      vec3.add(totalTorqueA, totalTorqueA, vec3.cross(vec3.create(), rA, vec3.scale(vec3.create(), pointImpulse, -1)))

      vec3.add(totalImpulseB, totalImpulseB, pointImpulse)
      vec3.add(totalTorqueB, totalTorqueB, vec3.cross(vec3.create(), rB, pointImpulse))
    })

    // Apply accumulated impulses
    if (collision.bodyA.isDynamic) {
      collision.bodyA.applyImpulse(totalImpulseA)
      collision.bodyA.applyAngularImpulse(totalTorqueA)
    }
    if (collision.bodyB.isDynamic) {
      collision.bodyB.applyImpulse(totalImpulseB)
      collision.bodyB.applyAngularImpulse(totalTorqueB)
    }
  }
}
