import { vec3 } from 'gl-matrix'
import type { Collision } from '../collisions/collision'
import { Solver } from './solver'
import type { Time } from '@/models/time'

export class ImpulseSolver extends Solver {
  private baumgarte: number = 0.01 // Further reduced from 0.05 to minimize bouncing
  private slop: number = 0.02 // Increased to match PositionSolver
  private contactCache: Map<string, { normalImpulse: number; tangentImpulse: vec3 }> = new Map()

  // Pre-allocated vectors for temporary calculations
  private _rA = vec3.create()
  private _rB = vec3.create()
  private _vrA = vec3.create()
  private _vrB = vec3.create()
  private _vr = vec3.create()
  private _tangent = vec3.create()
  private _tangentNormalized = vec3.create()
  private _impulse = vec3.create()
  private _tangentImpulse = vec3.create()
  private _pointImpulse = vec3.create()

  // Accumulators
  private _totalImpulseA = vec3.create()
  private _totalTorqueA = vec3.create()
  private _totalImpulseB = vec3.create()
  private _totalTorqueB = vec3.create()

  // Additional temps
  private _rnA = vec3.create()
  private _rnB = vec3.create()
  private _rtA = vec3.create()
  private _rtB = vec3.create()
  private _tmpVec1 = vec3.create()
  private _tmpVec2 = vec3.create()
  private _negPointImpulse = vec3.create() // For -pointImpulse

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

    const totalImpulseA = this._totalImpulseA
    vec3.set(totalImpulseA, 0, 0, 0)
    const totalTorqueA = this._totalTorqueA
    vec3.set(totalTorqueA, 0, 0, 0)
    const totalImpulseB = this._totalImpulseB
    vec3.set(totalImpulseB, 0, 0, 0)
    const totalTorqueB = this._totalTorqueB
    vec3.set(totalTorqueB, 0, 0, 0)

    manifold.points?.forEach((point) => {
      const rA = this._rA
      vec3.subtract(rA, point.a, collision.bodyA.position)

      const rB = this._rB
      vec3.subtract(rB, point.b, collision.bodyB.position)

      const vrA = this._vrA
      vec3.cross(this._tmpVec1, collision.bodyA.angularVelocity, rA)
      vec3.add(vrA, collision.bodyA.velocity, this._tmpVec1)

      const vrB = this._vrB
      vec3.cross(this._tmpVec1, collision.bodyB.angularVelocity, rB)
      vec3.add(vrB, collision.bodyB.velocity, this._tmpVec1)

      const vr = this._vr
      vec3.subtract(vr, vrB, vrA)
      const normalVelocity = vec3.dot(vr, point.normal)

      const tangent = this._tangent
      vec3.scale(this._tmpVec1, point.normal, normalVelocity)
      vec3.subtract(tangent, vr, this._tmpVec1)

      const tangentNormalized = this._tangentNormalized
      if (vec3.length(tangent) > 0) {
        vec3.normalize(tangentNormalized, tangent)
      } else {
        vec3.set(tangentNormalized, 0, 0, 0)
      }

      const vt = vec3.dot(vr, tangentNormalized)

      const restitution = Math.min(collision.bodyA.restitution, collision.bodyB.restitution)

      const mA = collision.bodyA.inverseMass
      const mB = collision.bodyB.inverseMass
      const iA = collision.bodyA.inverseInertiaTensor
      const iB = collision.bodyB.inverseInertiaTensor

      const rnA = this._rnA
      vec3.cross(rnA, rA, point.normal)
      const rnB = this._rnB
      vec3.cross(rnB, rB, point.normal)

      // kNormal = mA + mB + dot(rnA*iA, rnA) + dot(rnB*iB, rnB)
      // Note: iA is scalar inverse inertia tensor (simplified for now? code treated it as number)
      // Looking at code: const iA = collision.bodyA.inverseInertiaTensor
      // If it's a number, scale is correct.

      vec3.scale(this._tmpVec1, rnA, iA)
      const termA = vec3.dot(this._tmpVec1, rnA)

      vec3.scale(this._tmpVec1, rnB, iB)
      const termB = vec3.dot(this._tmpVec1, rnB)

      const kNormal = mA + mB + termA + termB
      const normalMass = kNormal > 0 ? 1 / kNormal : 0

      const rtA = this._rtA
      vec3.cross(rtA, rA, tangentNormalized)
      const rtB = this._rtB
      vec3.cross(rtB, rB, tangentNormalized)

      vec3.scale(this._tmpVec1, rtA, iA)
      const termTA = vec3.dot(this._tmpVec1, rtA)

      vec3.scale(this._tmpVec1, rtB, iB)
      const termTB = vec3.dot(this._tmpVec1, rtB)

      const kTangent = mA + mB + termTA + termTB
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

      const impulse = this._impulse
      vec3.scale(impulse, point.normal, lambda)

      const maxStaticFrictionImpulse = Math.sqrt(collision.bodyA.staticFriction * collision.bodyB.staticFriction) * lambda
      const maxDynamicFrictionImpulse = Math.sqrt(collision.bodyA.dynamicFriction * collision.bodyB.dynamicFriction) * lambda
      let tangentImpulseScalar = -vt * tangentMass
      if (Math.abs(tangentImpulseScalar) > maxStaticFrictionImpulse) {
        tangentImpulseScalar = Math.sign(tangentImpulseScalar) * maxDynamicFrictionImpulse
      }

      const tangentImpulse = this._tangentImpulse
      vec3.scale(tangentImpulse, tangentNormalized, tangentImpulseScalar)

      const pointImpulse = this._pointImpulse
      vec3.add(pointImpulse, impulse, tangentImpulse)

      const negPointImpulse = this._negPointImpulse
      vec3.scale(negPointImpulse, pointImpulse, -1)

      vec3.add(totalImpulseA, totalImpulseA, negPointImpulse)

      vec3.cross(this._tmpVec1, rA, negPointImpulse)
      vec3.add(totalTorqueA, totalTorqueA, this._tmpVec1)

      vec3.add(totalImpulseB, totalImpulseB, pointImpulse)

      vec3.cross(this._tmpVec1, rB, pointImpulse)
      vec3.add(totalTorqueB, totalTorqueB, this._tmpVec1)
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
