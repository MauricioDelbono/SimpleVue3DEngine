import type { vec3, vec4 } from 'gl-matrix'

export interface IMaterial {
  albedo: vec4
  specular: vec4
  roughness: number
  specularFactor: number
  diffuse: WebGLTexture | null
}

export class Material {
  public albedo: vec4
  public specular: vec4
  public roughness: number
  public specularFactor: number
  public diffuse: WebGLTexture | null

  constructor() {
    this.albedo = [0.5, 0.5, 0.5, 1]
    this.specular = [1, 1, 1, 1]
    this.roughness = 80
    this.specularFactor = 1
    this.diffuse = null
  }

  public use() {
    // Do nothing
  }
}

export class HDRMaterial {
  public ambient: vec3
  public diffuse: vec3
  public specular: vec3
  public shininess: number

  constructor() {
    this.ambient = [0.5, 0.5, 0.5]
    this.diffuse = [0.5, 0.5, 0.5]
    this.specular = [0.5, 0.5, 0.5]
    this.shininess = 32.0
  }
}
