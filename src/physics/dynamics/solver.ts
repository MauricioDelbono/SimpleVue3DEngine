import type { Collision } from '../collisions/collision'

export abstract class Solver {
  public abstract solve(collisions: Collision[], delta: number): void
}
