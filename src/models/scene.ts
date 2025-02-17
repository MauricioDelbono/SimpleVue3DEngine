import { vec3, vec4 } from 'gl-matrix'
import { Entity } from './entity'
import { Camera } from './camera'
import { Mesh } from './mesh'
import { PointLight, DirectionalLight, SpotLight } from './light'
import type { Texture } from './types'
import Primitives from '@/helpers/primitives'
import type { Material } from './material'
import { useAssetsStore } from '@/stores/assets'
import type { Time } from './time'

export class Skybox {
  public texture: Texture
  public mesh: Mesh
  public pipeline: string

  constructor(texture: Texture, mesh: Mesh) {
    this.texture = texture
    this.mesh = mesh
    this.pipeline = 'skybox'
  }
}

export class Fog {
  public color: vec4
  public near: number
  public far: number

  constructor() {
    this.color = vec4.fromValues(0.5, 0.5, 0.5, 1)
    this.near = 1
    this.far = 1
  }
}

export interface IScene {
  fog: Fog
  skybox?: Skybox
  camera: Camera
  entities: Entity[]
  defaultPipeline: string
  lights: Entity[]
  spotLight: SpotLight | null
  directionalLight: DirectionalLight | null
  wireframe: boolean
  debugColliders: boolean

  addEntity(entity: Entity): void
  removeEntity(entity: Entity): void
  setSkybox(skybox: Skybox): void
  update(time: number, renderDelta: number): void
  lateUpdate(time: number, renderDelta: number): void
}

export class Scene {
  public fog: Fog
  public skybox?: Skybox
  public camera: Camera
  public entities: Entity[]
  public defaultPipeline = 'default'
  public pointLights: PointLight[]
  public spotLight: SpotLight | null
  public directionalLight: DirectionalLight | null
  public wireframe: boolean = false
  public debugColliders: boolean = false

  public assets = useAssetsStore()

  constructor() {
    this.fog = new Fog()
    this.camera = new Camera()
    this.entities = []
    this.pointLights = []
    this.spotLight = null
    this.directionalLight = null
    this.addCamera(this.camera)
  }

  public addCamera(camera: Camera) {
    this.entities.push(camera)
  }

  public removeEntity(entity: Entity) {
    entity.destroy()
    if (entity.parent) {
      entity.parent.removeChild(entity)
    } else {
      const index = this.entities.indexOf(entity)
      if (index > -1) {
        this.entities.splice(index, 1)
      }
    }
  }

  public createEntity(position: vec3, mesh: Mesh, material?: Material, parent?: Entity): Entity {
    const entity = new Entity(mesh.name, mesh, position)
    entity.setMaterial(material ?? this.assets.materials.default)

    if (!parent) {
      this.entities.push(entity)
    } else {
      parent.addChild(entity)
    }

    return entity
  }

  public createPointLight(position: vec3, mesh: Mesh, parent?: Entity): PointLight {
    const light = new PointLight(mesh, position)
    if (!parent) {
      this.entities.push(light)
    } else {
      parent.addChild(light)
    }

    this.pointLights.push(light)
    return light
  }

  public createSpotLight(position: vec3, mesh: Mesh, parent?: Entity): SpotLight {
    const light = new SpotLight(mesh, position)
    if (!parent) {
      this.entities.push(light)
    } else {
      parent.addChild(light)
    }

    this.spotLight = light
    return light
  }

  public createDirectionalLight(position?: vec3, mesh?: Mesh): DirectionalLight {
    const light = new DirectionalLight(mesh, position)
    this.entities.push(light)
    this.directionalLight = light
    return light
  }

  public setSkybox(texture: Texture) {
    const mesh = Primitives.createXYQuad()
    this.skybox = new Skybox(texture, mesh)
  }

  public update(time: Time) {
    this.entities.forEach((entity) => entity.update(time))
  }

  public lateUpdate(time: Time) {
    this.entities.forEach((entity) => entity.lateUpdate(time))
  }

  public updateTransformMatrices() {
    this.entities.forEach((entity) => entity.updateTransformMatrix())
  }
}
