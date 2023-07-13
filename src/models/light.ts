import type { vec3 } from 'gl-matrix'
import { Entity } from './entity'

export class Light extends Entity {
  public ambient: vec3
  public diffuse: vec3
  public specular: vec3

  constructor() {
    super()
    this.ambient = [0.2, 0.2, 0.2]
    this.diffuse = [0.5, 0.5, 0.5]
    this.specular = [1, 1, 1]
  }
}
