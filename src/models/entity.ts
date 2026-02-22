import { v4 as uuid } from 'uuid'

import type { Class } from '@/constants/types'
import { Component } from './component'
import { Material } from './material'
import { Mesh } from './mesh'
import { Transform } from './transform'
import { mat4, vec3 } from 'gl-matrix'
import type { Time } from './time'
import { Collider } from '@/physics/collisions/collider'

const tmpCenter = vec3.create()
const tmpExtent = vec3.create()
const tmpNewCenter = vec3.create()
const tmpNewExtent = vec3.create()

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

  public worldMin: vec3 = vec3.create()
  public worldMax: vec3 = vec3.create()

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

    this.updateWorldAABB()

    this.children.forEach((child) => {
      child.updateTransformMatrix(this.transform.worldMatrix)
    })

    const colliders = this.getComponents(Collider)
    colliders.forEach((collider) => {
      collider.updateTransformMatrix(this.transform.worldMatrix)
    })
  }

  public updateWorldAABB() {
    const min = this.mesh.min
    const max = this.mesh.max

    // Calculate center and extent of the AABB
    vec3.add(tmpCenter, min, max)
    vec3.scale(tmpCenter, tmpCenter, 0.5)

    vec3.subtract(tmpExtent, max, min)
    vec3.scale(tmpExtent, tmpExtent, 0.5)

    // Transform center
    vec3.transformMat4(tmpNewCenter, tmpCenter, this.transform.worldMatrix)

    // Transform extent (ignoring translation)
    const m = this.transform.worldMatrix
    const eX = tmpExtent[0]
    const eY = tmpExtent[1]
    const eZ = tmpExtent[2]

    tmpNewExtent[0] = Math.abs(m[0]) * eX + Math.abs(m[4]) * eY + Math.abs(m[8]) * eZ
    tmpNewExtent[1] = Math.abs(m[1]) * eX + Math.abs(m[5]) * eY + Math.abs(m[9]) * eZ
    tmpNewExtent[2] = Math.abs(m[2]) * eX + Math.abs(m[6]) * eY + Math.abs(m[10]) * eZ

    // Update worldMin and worldMax
    vec3.subtract(this.worldMin, tmpNewCenter, tmpNewExtent)
    vec3.add(this.worldMax, tmpNewCenter, tmpNewExtent)
  }
}
