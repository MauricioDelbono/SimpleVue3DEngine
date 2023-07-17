import type { vec3 } from 'gl-matrix'
import { Entity } from './entity'
import utils from '@/helpers/utils'

export class PointLight extends Entity {
  public ambient: vec3
  public diffuse: vec3
  public specular: vec3

  constructor() {
    super()
    this.ambient = [0.2, 0.2, 0.2]
    this.diffuse = [0.8, 0.8, 0.8]
    this.specular = [1, 1, 1]
  }
}

export class SpotLight extends Entity {
  public direction: vec3
  public ambient: vec3
  public diffuse: vec3
  public specular: vec3
  public cutOff: number = 0
  public outerCutOff: number = 0

  constructor() {
    super()
    this.direction = this.transform.getForwardVector()
    this.ambient = [0, 0, 0]
    this.diffuse = [1, 1, 1]
    this.specular = [1, 1, 1]
    this.setCutOff(12.5, 15.0)
  }

  public setCutOff(cutOff: number, outerCutOff: number) {
    this.cutOff = Math.cos(utils.degToRad(cutOff))
    this.outerCutOff = Math.cos(utils.degToRad(outerCutOff))
  }
}

export class DirectionalLight extends Entity {
  public direction: vec3
  public ambient: vec3
  public diffuse: vec3
  public specular: vec3

  constructor() {
    super()
    this.direction = this.transform.getForwardVector()
    this.ambient = [0.05, 0.05, 0.05]
    this.diffuse = [0.4, 0.4, 0.4]
    this.specular = [0.5, 0.5, 0.5]
  }
}
