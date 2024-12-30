import type { Time } from '@/models/time'
import type { Collision } from '../collisions/collision'

export abstract class Solver {
  public abstract solve(collisions: Collision[], time: Time): void
}
