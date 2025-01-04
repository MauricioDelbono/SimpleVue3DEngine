import { vec3 } from 'gl-matrix'
import type { Collision } from '../collisions/collision'
import { Solver } from './solver'
import type { Time } from '@/models/time'

export class ImpulseSolver extends Solver {
  public solve(collisions: Collision[], time: Time) {
    collisions.forEach((collision) => {
      // this.implementation1(collision, time)
      this.implementation2(collision, time)
    })
  }

  public implementation2(collision: Collision, time: Time) {
    const relativeVelocity = vec3.subtract(vec3.create(), collision.entityB.velocity, collision.entityA.velocity)
    const normalVelocity = vec3.dot(relativeVelocity, collision.points.normal)

    // Calculate impulse only if bodies are moving toward each other
    if (normalVelocity > 0) return

    // Restitution (elasticity)
    const restitution = Math.min(collision.entityA.restitution, collision.entityB.restitution)

    // Compute impulse scalar
    const impulseScalar = (-(1 + restitution) * normalVelocity) / (collision.entityA.inverseMass + collision.entityB.inverseMass)

    const impulse = vec3.scale(vec3.create(), collision.points.normal, impulseScalar)

    // Handle friction (tangential velocity)
    const tangent = vec3.subtract(vec3.create(), relativeVelocity, vec3.scale(vec3.create(), collision.points.normal, normalVelocity))
    const tangentNormalized = vec3.normalize(vec3.create(), tangent)

    const rA = vec3.subtract(vec3.create(), collision.points.a, collision.entityA.entity.transform.worldPosition)
    const rB = vec3.subtract(vec3.create(), collision.points.b, collision.entityB.entity.transform.worldPosition)
    const relativeAngularVelocityTangent = vec3.subtract(
      vec3.create(),
      vec3.divide(vec3.create(), collision.entityA.angularVelocity, rA),
      vec3.divide(vec3.create(), collision.entityB.angularVelocity, rB)
    )
    vec3.add(relativeVelocity, relativeVelocity, relativeAngularVelocityTangent)
    const tangentVelocity = vec3.dot(relativeVelocity, tangentNormalized)

    const maxStaticFrictionImpulse = Math.sqrt(collision.entityA.staticFriction * collision.entityB.staticFriction) * impulseScalar
    const maxDynamicFrictionImpulse = Math.sqrt(collision.entityA.dynamicFriction * collision.entityB.dynamicFriction) * impulseScalar

    let frictionImpulse = 0
    let staticFriction = false

    if (Math.abs(tangentVelocity) < maxStaticFrictionImpulse) {
      // Static friction applies
      staticFriction = true
      frictionImpulse = -tangentVelocity / (collision.entityA.inverseMass + collision.entityB.inverseMass)
    } else {
      // Dynamic friction applies
      frictionImpulse = -Math.sign(tangentVelocity) * maxDynamicFrictionImpulse
    }

    const frictionVector = vec3.scale(vec3.create(), tangentNormalized, frictionImpulse)

    if (collision.entityA.isDynamic) {
      const impulseA = vec3.negate(vec3.create(), impulse)
      if (!staticFriction) {
        // vec3.add(impulseA, impulseA, frictionVector)
      }

      collision.entityA.applyImpulse(impulseA)

      // Handle angular effects (rolling and toppling)
      let angularImpulse = vec3.cross(vec3.create(), rA, frictionVector)
      // angularImpulse = vec3.add(
      //   angularImpulse,
      //   angularImpulse,
      //   vec3.cross(vec3.create(), rA, vec3.scale(vec3.create(), frictionVector, -1))
      // )
      collision.entityA.applyAngularImpulse(angularImpulse)
    }

    if (collision.entityB.isDynamic) {
      const impulseB = impulse
      if (!staticFriction) {
        // vec3.add(impulseB, impulseB, vec3.scale(vec3.create(), frictionVector, -1))
      }

      collision.entityB.applyImpulse(impulseB)

      // Handle angular effects (rolling and toppling)
      let angularImpulse = vec3.cross(vec3.create(), rB, vec3.scale(vec3.create(), frictionVector, -1))
      // angularImpulse = vec3.add(angularImpulse, angularImpulse, vec3.cross(vec3.create(), rB, frictionVector))
      collision.entityB.applyAngularImpulse(angularImpulse)
    }
  }

  public implementation1(collision: Collision, time: Time) {
    //impulse
    const relativeVelocity = vec3.sub(vec3.create(), collision.entityB.velocity, collision.entityA.velocity)
    const velocityAlongNormal = vec3.dot(relativeVelocity, collision.points.normal)
    if (velocityAlongNormal > 0) return

    const restitution = Math.min(collision.entityA.restitution, collision.entityB.restitution)
    const impulseScalar = (-(1 + restitution) * velocityAlongNormal) / (collision.entityA.inverseMass + collision.entityB.inverseMass)
    const impulse = vec3.scale(vec3.create(), collision.points.normal, impulseScalar)
    if (collision.entityB.isDynamic) {
      collision.entityB.applyImpulse(impulse)
    }

    if (collision.entityA.isDynamic) {
      vec3.negate(impulse, impulse)
      collision.entityA.applyImpulse(impulse)
    }

    //friction
    const tangent = vec3.subtract(
      vec3.create(),
      relativeVelocity,
      vec3.scale(vec3.create(), collision.points.normal, vec3.dot(relativeVelocity, collision.points.normal))
    )
    vec3.normalize(tangent, tangent)
    const frictionImpulseScalar = -vec3.dot(relativeVelocity, tangent) / (collision.entityA.inverseMass + collision.entityB.inverseMass)
    const frictionImpulse = vec3.scale(vec3.create(), tangent, frictionImpulseScalar)

    const staticFriction = Math.sqrt(collision.entityA.staticFriction * collision.entityB.staticFriction)
    const dynamicFriction = Math.sqrt(collision.entityA.dynamicFriction * collision.entityB.dynamicFriction)

    const maxStaticFrictionImpulse = impulseScalar * staticFriction
    let frictionImpulseToApply = frictionImpulse
    const isSliding = vec3.length(frictionImpulse) > maxStaticFrictionImpulse

    if (isSliding) {
      frictionImpulseToApply = vec3.scale(vec3.create(), frictionImpulse, dynamicFriction)
      console.log('sliding')
    }

    if (collision.entityA.isDynamic) {
      collision.entityA.applyForce(vec3.scale(vec3.create(), frictionImpulseToApply, -1))
    }

    if (collision.entityB.isDynamic) {
      collision.entityB.applyForce(frictionImpulseToApply)
    }

    //torque

    if (isSliding && collision.entityA.isDynamic) {
      const rA = vec3.subtract(vec3.create(), collision.points.a, collision.entityA.position)
      collision.entityA.applyAngularImpulseOld(rA, frictionImpulseToApply)
    }

    if (isSliding && collision.entityB.isDynamic) {
      const rB = vec3.subtract(vec3.create(), collision.points.b, collision.entityB.position)
      collision.entityB.applyAngularImpulseOld(rB, vec3.scale(vec3.create(), frictionImpulseToApply, -1))
    }
  }
}
