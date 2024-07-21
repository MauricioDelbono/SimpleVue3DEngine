import { vec3 } from 'gl-matrix'
import { Entity } from './entity'

export class Camera extends Entity {
  public up: vec3

  constructor() {
    super()
    this.up = [0, 1, 0]
  }

  public update(time: number, renderDelta: number) {
    // Do nothing
  }

  public lateUpdate(time: number, renderDelta: number) {
    // Do nothing
  }

  public render() {
    // Do nothing
  }
}
