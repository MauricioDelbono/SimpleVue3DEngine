import { vec3 } from 'gl-matrix'
import { Entity } from './entity'
import type { Time } from './time'

export class Camera extends Entity {
  public up: vec3

  constructor() {
    super('Camera')
    this.up = [0, 1, 0]
  }

  public update(time: Time) {
    // Do nothing
  }

  public lateUpdate(time: Time) {
    // Do nothing
  }

  public render() {
    // Do nothing
  }
}
