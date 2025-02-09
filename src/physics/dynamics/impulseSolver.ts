import { vec3 } from 'gl-matrix'
import type { Collision } from '../collisions/collision'
import { Solver } from './solver'
import type { Time } from '@/models/time'

export class ImpulseSolver extends Solver {
  public solve(collisions: Collision[], time: Time) {
    collisions.forEach((collision) => {
      this.solveCollision(collision, time)
    })
  }

  public solveCollision(collision: Collision, time: Time) {
    const rA = collision.points.a
    const rB = collision.points.b
    const vrA = vec3.add(vec3.create(), collision.bodyA.velocity, vec3.cross(vec3.create(), collision.bodyA.angularVelocity, rA))
    const vrB = vec3.add(vec3.create(), collision.bodyB.velocity, vec3.cross(vec3.create(), collision.bodyB.angularVelocity, rB))
    const vr = vec3.subtract(vec3.create(), vrB, vrA)
    const normalVelocity = vec3.dot(vr, collision.points.normal)
    const tangent = vec3.subtract(vec3.create(), vr, vec3.scale(vec3.create(), collision.points.normal, normalVelocity))
    const tangentNormalized = vec3.normalize(vec3.create(), tangent)
    const vt = vec3.dot(vr, tangentNormalized)

    // Calculate impulse only if bodies are moving toward each other
    if (normalVelocity > 0) return

    // Restitution (elasticity)
    const restitution = Math.min(collision.bodyA.restitution, collision.bodyB.restitution)

    // Masses
    const mA = collision.bodyA.inverseMass
    const mB = collision.bodyB.inverseMass
    const iA = collision.bodyA.inverseInertiaTensor
    const iB = collision.bodyB.inverseInertiaTensor

    const rnA = vec3.cross(vec3.create(), rA, collision.points.normal)
    const rnB = vec3.cross(vec3.create(), rB, collision.points.normal)
    const kNormal = mA + mB + iA * vec3.dot(rnA, rnA) + iB * vec3.dot(rnB, rnB)
    const normalMass = kNormal > 0 ? 1 / kNormal : 0

    const rtA = vec3.cross(vec3.create(), rA, tangentNormalized)
    const rtB = vec3.cross(vec3.create(), rB, tangentNormalized)
    const kTangent = mA + mB + iA * vec3.dot(rtA, rtA) + iB * vec3.dot(rtB, rtB)
    const tangentMass = kTangent > 0 ? 1 / kTangent : 0

    // Compute impulse
    const impulseScalar = -(1 + restitution) * normalVelocity * normalMass
    const impulse = vec3.scale(vec3.create(), collision.points.normal, impulseScalar)

    // Compute tangent impulse
    const maxStaticFrictionImpulse = Math.sqrt(collision.bodyA.staticFriction * collision.bodyB.staticFriction) * impulseScalar
    const maxDynamicFrictionImpulse = Math.sqrt(collision.bodyA.dynamicFriction * collision.bodyB.dynamicFriction) * impulseScalar
    let tangentImpulseScalar = -vt * tangentMass
    if (Math.abs(tangentImpulseScalar) > maxStaticFrictionImpulse) {
      tangentImpulseScalar = Math.sign(tangentImpulseScalar) * maxDynamicFrictionImpulse
    }

    const tangentImpulse = vec3.scale(vec3.create(), tangentNormalized, tangentImpulseScalar)

    // Apply impulse
    if (collision.bodyA.isDynamic) {
      const impulseA = vec3.scale(vec3.create(), impulse, -1)
      vec3.add(impulseA, impulseA, vec3.scale(vec3.create(), tangentImpulse, -1))
      collision.bodyA.applyImpulse(impulseA)

      const angularImpulse = vec3.cross(vec3.create(), rA, impulseA)
      collision.bodyA.applyAngularImpulse(angularImpulse)
    }

    if (collision.bodyB.isDynamic) {
      const impulseB = impulse
      vec3.add(impulseB, impulseB, tangentImpulse)
      collision.bodyB.applyImpulse(impulseB)

      const angularImpulse = vec3.cross(vec3.create(), rB, impulseB)
      collision.bodyB.applyAngularImpulse(angularImpulse)
    }
  }
}
