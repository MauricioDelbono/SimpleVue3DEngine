import type { vec3 } from 'gl-matrix'
import { Entity } from './entity'
import utils from '@/helpers/utils'

interface LightAttenuation {
  constant: number
  linear: number
  quadratic: number
}

const POINT_LIGHT_ATTENUATION_VALUES: Record<number, LightAttenuation> = {
  7: { constant: 1.0, linear: 0.7, quadratic: 1.8 },
  13: { constant: 1.0, linear: 0.35, quadratic: 0.44 },
  20: { constant: 1.0, linear: 0.22, quadratic: 0.2 },
  32: { constant: 1.0, linear: 0.14, quadratic: 0.07 },
  50: { constant: 1.0, linear: 0.09, quadratic: 0.032 },
  65: { constant: 1.0, linear: 0.07, quadratic: 0.017 },
  100: { constant: 1.0, linear: 0.045, quadratic: 0.0075 },
  160: { constant: 1.0, linear: 0.027, quadratic: 0.0028 },
  200: { constant: 1.0, linear: 0.022, quadratic: 0.0019 },
  325: { constant: 1.0, linear: 0.014, quadratic: 0.0007 },
  600: { constant: 1.0, linear: 0.007, quadratic: 0.0002 },
  3250: { constant: 1.0, linear: 0.0014, quadratic: 0.000007 }
}

export class PointLight extends Entity {
  public ambient: vec3
  public diffuse: vec3
  public specular: vec3

  public lightAttenuation: LightAttenuation

  constructor() {
    super()
    this.ambient = [0.2, 0.2, 0.2]
    this.diffuse = [0.8, 0.8, 0.8]
    this.specular = [1, 1, 1]

    this.lightAttenuation = POINT_LIGHT_ATTENUATION_VALUES[50]
  }

  public setLightAttenuation(distance: number) {
    const possibleAttenuationDistances = Object.keys(POINT_LIGHT_ATTENUATION_VALUES)
    if (!possibleAttenuationDistances.includes(distance.toString())) {
      throw new Error(`Invalid point light attenuation distance: ${distance}, possible values: ${possibleAttenuationDistances.join(', ')}`)
    }

    const pointLightAttenuation = POINT_LIGHT_ATTENUATION_VALUES[distance]
    this.lightAttenuation = pointLightAttenuation
  }
}

export class SpotLight extends Entity {
  public direction: vec3
  public ambient: vec3
  public diffuse: vec3
  public specular: vec3
  public cutOff: number = 0
  public outerCutOff: number = 0

  public lightAttenuation: LightAttenuation

  constructor() {
    super()
    this.direction = this.transform.getForwardVector()
    this.ambient = [0, 0, 0]
    this.diffuse = [1, 1, 1]
    this.specular = [1, 1, 1]
    this.setCutOff(12.5, 15.0)
    this.lightAttenuation = POINT_LIGHT_ATTENUATION_VALUES[100]
  }

  public setLightAttenuation(distance: number) {
    const possibleAttenuationDistances = Object.keys(POINT_LIGHT_ATTENUATION_VALUES)
    if (!possibleAttenuationDistances.includes(distance.toString())) {
      throw new Error(`Invalid point light attenuation distance: ${distance}, possible values: ${possibleAttenuationDistances.join(', ')}`)
    }

    const pointLightAttenuation = POINT_LIGHT_ATTENUATION_VALUES[distance]
    this.lightAttenuation = pointLightAttenuation
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
