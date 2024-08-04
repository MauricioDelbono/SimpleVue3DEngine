import type { vec3 } from 'gl-matrix'
import { Entity } from './entity'
import utils from '@/helpers/utils'
import type { Mesh } from './mesh'

export class PointLight extends Entity {
  public ambient: vec3
  public diffuse: vec3
  public specular: vec3

  constructor(mesh: Mesh | undefined, position: vec3 = [0, 0, 0]) {
    super('Point Light', mesh, position)
    this.ambient = [0.2, 0.2, 0.2]
    this.diffuse = [0.8, 0.8, 0.8]
    this.specular = [1, 1, 1]
    this.pipeline = 'light'
  }
}

export class SpotLight extends Entity {
  public direction: vec3
  public ambient: vec3
  public diffuse: vec3
  public specular: vec3
  public cutOff: number = 0
  public outerCutOff: number = 0

  constructor(mesh: Mesh | undefined, position: vec3 = [0, 0, 0]) {
    super('Spot Light', mesh, position)
    this.direction = this.transform.getForwardVector()
    this.ambient = [0, 0, 0]
    this.diffuse = [1, 1, 1]
    this.specular = [1, 1, 1]
    this.setCutOff(12.5, 15.0)
    this.pipeline = 'light'
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

  constructor(mesh: Mesh | undefined, position: vec3 = [0, 0, 0]) {
    super('Directional Light', mesh, position)
    this.direction = this.transform.getForwardVector()
    this.ambient = [0.05, 0.05, 0.05]
    this.diffuse = [0.4, 0.4, 0.4]
    this.specular = [0.5, 0.5, 0.5]
    this.pipeline = 'light'
  }
}
