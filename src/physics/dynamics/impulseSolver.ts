import { vec3 } from 'gl-matrix'
import type { Collision } from '../collisions/collision'
import { Solver } from './solver'
import type { Time } from '@/models/time'

export class ImpulseSolver extends Solver {
  public solve(collisions: Collision[], time: Time) {
    collisions.forEach((collision) => {
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

      if (collision.entityA.isDynamic) {
        collision.entityA.applyForce(vec3.scale(vec3.create(), frictionImpulse, -1))
      }

      if (collision.entityB.isDynamic) {
        collision.entityB.applyForce(frictionImpulse)
      }

      //torque
      const rA = vec3.subtract(vec3.create(), collision.points.a, collision.entityA.position)
      const rB = vec3.subtract(vec3.create(), collision.points.b, collision.entityB.position)
      const torqueA = vec3.cross(vec3.create(), rA, frictionImpulse)
      const torqueB = vec3.cross(vec3.create(), rB, vec3.scale(vec3.create(), frictionImpulse, -1))

      if (collision.entityA.isDynamic) {
        collision.entityA.applyAngularImpulse(torqueA)
      }

      if (collision.entityB.isDynamic) {
        collision.entityB.applyAngularImpulse(torqueB)
      }
    })
  }
}
