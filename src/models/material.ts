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
}

export class HDRMaterial {
  public albedo: vec3
  public diffuse: WebGLTexture | null
  public specular: WebGLTexture | null
  public emission: WebGLTexture | null
  public shininess: number

  constructor() {
    this.albedo = [0, 0, 0]
    this.diffuse = null
    this.specular = null
    this.emission = null
    this.shininess = 32.0
  }
}
