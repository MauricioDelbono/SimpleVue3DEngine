import type { vec3 } from 'gl-matrix'

export interface ICamera {
  position: vec3
  rotation: vec3
  up: vec3
}

export class Camera {
  public position: vec3
  public rotation: vec3
  public up: vec3

  constructor() {
    this.position = [0, 0, 0]
    this.rotation = [0, 0, 0]
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
