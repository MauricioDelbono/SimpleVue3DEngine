import { vec4, vec3 } from 'gl-matrix'
import { Entity } from './entity'
import { Camera } from './camera'
import { Mesh } from './mesh'
import type { Pipeline } from './pipeline'

export class Skybox {
  public texture: WebGLTexture
  public mesh: Mesh
  public pipeline: Pipeline

  constructor(texture: WebGLTexture, mesh: Mesh, pipeline: Pipeline) {
    this.texture = texture
    this.mesh = mesh
    this.pipeline = pipeline
  }
}

export interface IScene {
  fogColor: vec4
  fogNear: number
  fogFar: number
  lightDirection: vec3
  lightColor: vec4
  skybox?: Skybox
  camera: Camera
  entities: Entity[]

  addEntity(entity: Entity): void
  removeEntity(entity: Entity): void
  setSkybox(skybox: Skybox): void
  update(time: number, renderDelta: number): void
  lateUpdate(time: number, renderDelta: number): void
}

export class Scene {
  public fogColor: vec4
  public fogNear: number
  public fogFar: number
  public lightDirection: vec3
  public lightColor: vec4
  public skybox?: Skybox
  public camera: Camera
  public entities: Entity[]

  constructor() {
    this.fogColor = vec4.fromValues(0.5, 0.5, 0.5, 1)
    this.fogNear = 1
    this.fogFar = 1
    this.lightDirection = vec3.fromValues(1, 8, -10)
    this.lightColor = vec4.fromValues(1, 1, 1, 1)
    this.camera = new Camera()
    this.entities = []
  }

  public addEntity(entity: Entity) {
    this.entities.push(entity)
  }

  public removeEntity(entity: Entity) {
    if (entity.parent) {
      entity.parent.removeChild(entity)
    } else {
      const index = this.entities.indexOf(entity)
      if (index > -1) {
        this.entities.splice(index, 1)
      }
    }
  }

  public setSkybox(skybox: Skybox) {
    this.skybox = skybox
  }

  public update(time: number, renderDelta: number) {
    this.entities.forEach((entity) => entity.update(time, renderDelta))
  }

  public lateUpdate(time: number, renderDelta: number) {
    this.entities.forEach((entity) => entity.lateUpdate(time, renderDelta))
  }

  public updateWorldMatrix() {
    this.entities.forEach((entity) => entity.transform.updateWorldMatrix())
  }

  // public render() {
  //   this.entities.forEach((entity) => entity.render())
  // }

  // public renderSkybox() {
  //   if (this.skybox) {
  //     const { texture, mesh, pipeline } = this.skybox
  //     pipeline.use()
  //     pipeline.setUniform('uSkybox', texture)
  //     mesh.render()
  //   }
  // }

  // public renderDepth() {
  //   this.entities.forEach(entity => entity.renderDepth())
  // }

  // public renderShadow() {
  //   this.entities.forEach(entity => entity.renderShadow())
  // }

  // public renderGBuffer() {
  //   this.entities.forEach(entity => entity.renderGBuffer())
  // }

  // public renderLighting() {
  //   this.entities.forEach(entity => entity.renderLighting())
  // }

  // public renderPostProcessing() {
  //   this.entities.forEach(entity => entity.renderPostProcessing())
  // }

  // public renderUI() {
  //   this.entities.forEach(entity => entity.renderUI())
  // }
}
