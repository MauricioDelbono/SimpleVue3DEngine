import { vec3 } from 'gl-matrix'
import type { Collision } from '../collisions/collision'
import { Solver } from './solver'
import type { Time } from '@/models/time'

export class PositionSolver extends Solver {
  public solve(collisions: Collision[], time: Time) {
    collisions.forEach((collision) => {
      if (!collision.entityA.isDynamic && collision.entityB.isDynamic) {
        vec3.add(
          collision.entityB.position,
          collision.entityB.position,
          vec3.scale(collision.points.normal, collision.points.normal, collision.points.depth)
        )
      } else if (!collision.entityB.isDynamic && collision.entityA.isDynamic) {
        vec3.add(
          collision.entityA.position,
          collision.entityA.position,
          vec3.scale(collision.points.normal, collision.points.normal, -collision.points.depth)
        )
      } else {
        vec3.add(
          collision.entityB.position,
          collision.entityB.position,
          vec3.scale(collision.points.normal, collision.points.normal, collision.points.depth / 2)
        )
        vec3.add(
          collision.entityA.position,
          collision.entityA.position,
          vec3.scale(collision.points.normal, collision.points.normal, -collision.points.depth / 2)
        )
      }
    })
  }
}
