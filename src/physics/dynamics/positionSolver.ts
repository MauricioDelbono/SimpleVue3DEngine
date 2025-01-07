import { vec3 } from 'gl-matrix'
import type { Collision } from '../collisions/collision'
import { Solver } from './solver'
import type { Time } from '@/models/time'

export class PositionSolver extends Solver {
  public solve(collisions: Collision[], time: Time) {
    collisions.forEach((collision) => {
      if (!collision.entityA.isDynamic && collision.entityB.isDynamic) {
        const positionCorrection = vec3.scale(collision.points.normal, collision.points.normal, collision.points.depth)
        vec3.add(collision.entityB.position, collision.entityB.position, positionCorrection)
        vec3.add(collision.points.b, collision.points.b, positionCorrection)
      } else if (!collision.entityB.isDynamic && collision.entityA.isDynamic) {
        const positionCorrection = vec3.scale(collision.points.normal, collision.points.normal, -collision.points.depth)
        vec3.add(collision.entityA.position, collision.entityA.position, positionCorrection)
        vec3.add(collision.points.a, collision.points.a, positionCorrection)
      } else {
        const positionBCorrection = vec3.scale(collision.points.normal, collision.points.normal, collision.points.depth / 2)
        const positionACorrection = vec3.scale(collision.points.normal, collision.points.normal, -collision.points.depth / 2)
        vec3.add(collision.entityB.position, collision.entityB.position, positionBCorrection)
        vec3.add(collision.points.b, collision.points.b, positionBCorrection)
        vec3.add(collision.entityA.position, collision.entityA.position, positionACorrection)
        vec3.add(collision.points.a, collision.points.a, positionACorrection)
      }
    })
  }
}
