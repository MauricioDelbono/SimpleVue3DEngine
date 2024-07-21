import { vec3 } from 'gl-matrix'
import type { Texture } from './types'

export class Material {
  public color: vec3
  public diffuse: Texture
  public specular: Texture
  public emission: Texture
  public shininess: number

  constructor(
    diffuse: Texture = null,
    specular: Texture = null,
    emission: Texture = null,
    color = vec3.fromValues(0, 0, 0),
    shininess = 32.0
  ) {
    this.color = color
    this.shininess = shininess
    this.diffuse = diffuse
    this.specular = specular
    this.emission = emission
  }
}
