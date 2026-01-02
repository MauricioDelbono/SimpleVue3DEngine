import { vec3 } from 'gl-matrix'
import type { Collision } from '../collisions/collision'
import { Solver } from './solver'
import type { Time } from '@/models/time'

export class PositionSolver extends Solver {
  private correctionPercentage: number = 0.4 // Reduced from 0.8 to prevent over-correction
  private slop: number = 0.02 // Increased slop to allow more penetration

  public solve(collisions: Collision[], time: Time) {
    collisions.forEach((collision) => {
      const manifold = collision.manifold
      if (!manifold.hasCollision) return

      manifold.points.forEach((point) => {
        // Only correct if penetration is above slop threshold
        const correctionAmount = Math.max(point.depth - this.slop, 0) * this.correctionPercentage
        if (correctionAmount <= 0) return

        const correction = vec3.scale(vec3.create(), point.normal, correctionAmount)

        // Calculate total inverse mass for correction distribution
        const totalInverseMass = collision.bodyA.inverseMass + collision.bodyB.inverseMass
        if (totalInverseMass <= 0) return // Both bodies are static

        // Distribute correction based on inverse mass
        const bodyACorrectionFactor = collision.bodyA.inverseMass / totalInverseMass
        const bodyBCorrectionFactor = collision.bodyB.inverseMass / totalInverseMass

        // Apply position corrections to rigid bodies
        if (collision.bodyA.isDynamic) {
          const bodyACorrection = vec3.scale(vec3.create(), correction, -bodyACorrectionFactor)
          const beforePos = vec3.clone(collision.bodyA.position)
          console.log(
            `POSITION_CORRECTION_A: before=[${beforePos[0].toFixed(2)},${beforePos[1].toFixed(2)},${beforePos[2].toFixed(
              2
            )}] correction=[${bodyACorrection[0].toFixed(3)},${bodyACorrection[1].toFixed(3)},${bodyACorrection[2].toFixed(
              3
            )}] depth=${point.depth.toFixed(3)}`
          )
          vec3.add(collision.bodyA.position, collision.bodyA.position, bodyACorrection)

          // Apply angular position correction to reduce rotational drift
          const rA = vec3.subtract(vec3.create(), point.a, collision.bodyA.position)
          const angularCorrection = vec3.cross(vec3.create(), rA, bodyACorrection)
          vec3.scale(angularCorrection, angularCorrection, 0.1) // Small angular correction factor
          vec3.add(collision.bodyA.rotation, collision.bodyA.rotation, angularCorrection)
        }

        if (collision.bodyB.isDynamic) {
          const bodyBCorrection = vec3.scale(vec3.create(), correction, bodyBCorrectionFactor)
          vec3.add(collision.bodyB.position, collision.bodyB.position, bodyBCorrection)

          // Apply angular position correction to reduce rotational drift
          const rB = vec3.subtract(vec3.create(), point.b, collision.bodyB.position)
          const angularCorrection = vec3.cross(vec3.create(), rB, bodyBCorrection)
          vec3.scale(angularCorrection, angularCorrection, 0.1) // Small angular correction factor
          vec3.add(collision.bodyB.rotation, collision.bodyB.rotation, angularCorrection)
        }
      })
    })
  }
}
