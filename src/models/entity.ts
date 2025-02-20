import { v4 as uuid } from 'uuid'

import type { Class } from '@/constants/types'
import { Component } from './component'
import { Material } from './material'
import { Mesh } from './mesh'
import { Transform } from './transform'
import { mat4, type vec3 } from 'gl-matrix'
import type { Time } from './time'
import { Collider } from '@/physics/collisions/collider'

export class Entity {
  public transform: Transform
  public mesh: Mesh
  public parent: Entity | null = null
  public children: Entity[] = []
  public components: Component[] = []
  public pipeline: string | null = null
  public material: Material
  public name: string = 'Empty'
  public uuid: string = uuid()

  constructor(name: string = 'Empty', mesh: Mesh | null = null, position: vec3 = [0, 0, 0]) {
    this.transform = new Transform()
    this.transform.position = position
    this.mesh = mesh ?? new Mesh(name)
    this.material = new Material()
    this.name = this.mesh.name
  }

  public setMaterial(material: Material) {
    this.material = { ...material }
  }

  public update(time: Time) {
    this.components.forEach((component) => component.update(time))
  }

  public lateUpdate(time: Time) {
    this.components.forEach((component) => component.lateUpdate(time))
  }

  public destroy() {
    this.components.forEach((component) => component.destroy())
    this.components = []
    this.children.forEach((child) => child.destroy())
    this.children = []
  }

  public addComponent(component: Component) {
    this.components.push(component)
    component.entity = this
    component.awake()
  }

  public removeComponent(component: Component) {
    const index = this.components.indexOf(component)
    if (index > -1) {
      this.components.splice(index, 1)
      component.destroy()
    }
  }

  public getComponents<T extends Component>(type: Class<T>): T[] {
    return this.components.filter((component) => component instanceof type) as T[]
  }

  public getComponent<T extends Component>(type: Class<T>): T | null {
    const components = this.getComponents(type)
    return components.length > 0 ? components[0] : null
  }

  public addChild(child: Entity) {
    this.children.push(child)
    child.parent = this
  }

  public removeChild(child: Entity) {
    const index = this.children.indexOf(child)
    if (index > -1) {
      this.children[index].parent = null
      this.children.splice(index, 1)
    }
  }

  public updateTransformMatrix(matrix?: mat4) {
    this.transform.updateWorldMatrix(matrix)

    this.children.forEach((child) => {
      child.updateTransformMatrix(this.transform.worldMatrix)
    })

    const colliders = this.getComponents(Collider)
    colliders.forEach((collider) => {
      collider.updateTransformMatrix(this.transform.worldMatrix)
    })
  }

  // public render() {
  //   const { mesh, material } = this
  //   material.use()
  //   mesh.render()
  // }

  // public renderDepth() {
  //   const { mesh } = this
  //   mesh.render()
  // }

  // public renderShadow() {
  //   const { mesh } = this
  //   mesh.render()
  // }
}
