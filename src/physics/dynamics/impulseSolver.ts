import { vec3 } from 'gl-matrix'
import type { Collision } from '../collisions/collision'
import { Solver } from './solver'
import type { Time } from '@/models/time'

const tmpVec1 = vec3.create()
const tmpVec2 = vec3.create()
const tmpVec3 = vec3.create()
const tmpVec4 = vec3.create()
const tmpVec5 = vec3.create()
const tmpVec6 = vec3.create()

// Accumulators
const accImpulseA = vec3.create()
const accTorqueA = vec3.create()
const accImpulseB = vec3.create()
const accTorqueB = vec3.create()

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

    // Reset accumulators
    vec3.set(accImpulseA, 0, 0, 0)
    vec3.set(accTorqueA, 0, 0, 0)
    vec3.set(accImpulseB, 0, 0, 0)
    vec3.set(accTorqueB, 0, 0, 0)

    manifold.points?.forEach((point) => {
      // rA = point.a - bodyA.position -> tmpVec1
      vec3.subtract(tmpVec1, point.a, collision.bodyA.position)
      // rB = point.b - bodyB.position -> tmpVec2
      vec3.subtract(tmpVec2, point.b, collision.bodyB.position)

      // vrA = vA + wA x rA -> tmpVec3
      vec3.cross(tmpVec3, collision.bodyA.angularVelocity, tmpVec1)
      vec3.add(tmpVec3, collision.bodyA.velocity, tmpVec3)

      // vrB = vB + wB x rB -> tmpVec4
      vec3.cross(tmpVec4, collision.bodyB.angularVelocity, tmpVec2)
      vec3.add(tmpVec4, collision.bodyB.velocity, tmpVec4)

      // vr = vrB - vrA -> tmpVec3 (reuse)
      vec3.subtract(tmpVec3, tmpVec4, tmpVec3)

      const normalVelocity = vec3.dot(tmpVec3, point.normal)

      // tangent = vr - normal * normalVelocity -> tmpVec4 (reuse)
      vec3.scale(tmpVec4, point.normal, normalVelocity)
      vec3.subtract(tmpVec4, tmpVec3, tmpVec4)

      // tangentNormalized -> tmpVec5
      if (vec3.length(tmpVec4) > 0) {
        vec3.normalize(tmpVec5, tmpVec4)
      } else {
        vec3.set(tmpVec5, 0, 0, 0)
      }

      const vt = vec3.dot(tmpVec3, tmpVec5)

      const restitution = Math.min(collision.bodyA.restitution, collision.bodyB.restitution)

      const mA = collision.bodyA.inverseMass
      const mB = collision.bodyB.inverseMass
      const iA = collision.bodyA.inverseInertiaTensor
      const iB = collision.bodyB.inverseInertiaTensor

      // rnA = rA x normal -> tmpVec3 (reuse)
      vec3.cross(tmpVec3, tmpVec1, point.normal)
      // rnB = rB x normal -> tmpVec4 (reuse)
      vec3.cross(tmpVec4, tmpVec2, point.normal)

      // kNormal
      const kNormal = mA + mB + iA * vec3.dot(tmpVec3, tmpVec3) + iB * vec3.dot(tmpVec4, tmpVec4)
      const normalMass = kNormal > 0 ? 1 / kNormal : 0

      // rtA = rA x tangentNormalized -> tmpVec6
      vec3.cross(tmpVec6, tmpVec1, tmpVec5)
      // rtB = rB x tangentNormalized -> tmpVec3 (reuse)
      vec3.cross(tmpVec3, tmpVec2, tmpVec5)

      // kTangent
      const kTangent = mA + mB + iA * vec3.dot(tmpVec6, tmpVec6) + iB * vec3.dot(tmpVec3, tmpVec3)
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

      // impulse = normal * lambda -> tmpVec4 (reuse)
      vec3.scale(tmpVec4, point.normal, lambda)

      const maxStaticFrictionImpulse = Math.sqrt(collision.bodyA.staticFriction * collision.bodyB.staticFriction) * lambda
      const maxDynamicFrictionImpulse = Math.sqrt(collision.bodyA.dynamicFriction * collision.bodyB.dynamicFriction) * lambda
      let tangentImpulseScalar = -vt * tangentMass
      if (Math.abs(tangentImpulseScalar) > maxStaticFrictionImpulse) {
        tangentImpulseScalar = Math.sign(tangentImpulseScalar) * maxDynamicFrictionImpulse
      }

      // tangentImpulse = tangentNormalized * scalar -> tmpVec6 (reuse)
      vec3.scale(tmpVec6, tmpVec5, tangentImpulseScalar)

      // pointImpulse = impulse + tangentImpulse -> tmpVec3 (reuse)
      vec3.add(tmpVec3, tmpVec4, tmpVec6)

      // Accumulate Total Impulse A
      // totalImpulseA -= pointImpulse
      vec3.scale(tmpVec5, tmpVec3, -1) // -pointImpulse -> tmpVec5
      vec3.add(accImpulseA, accImpulseA, tmpVec5)

      // Accumulate Total Torque A
      // totalTorqueA += rA x -pointImpulse
      vec3.cross(tmpVec5, tmpVec1, tmpVec5)
      vec3.add(accTorqueA, accTorqueA, tmpVec5)

      // Accumulate Total Impulse B
      // totalImpulseB += pointImpulse
      vec3.add(accImpulseB, accImpulseB, tmpVec3)

      // Accumulate Total Torque B
      // totalTorqueB += rB x pointImpulse
      vec3.cross(tmpVec5, tmpVec2, tmpVec3)
      vec3.add(accTorqueB, accTorqueB, tmpVec5)
    })

    // Apply accumulated impulses
    if (collision.bodyA.isDynamic) {
      collision.bodyA.applyImpulse(accImpulseA)
      collision.bodyA.applyAngularImpulse(accTorqueA)
    }
    if (collision.bodyB.isDynamic) {
      collision.bodyB.applyImpulse(accImpulseB)
      collision.bodyB.applyAngularImpulse(accTorqueB)
    }
  }
}
