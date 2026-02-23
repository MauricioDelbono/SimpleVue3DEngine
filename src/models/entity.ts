import { v4 as uuid } from 'uuid'

import type { Class } from '@/constants/types'
import { Component } from './component'
import { Material } from './material'
import { Mesh } from './mesh'
import { Transform } from './transform'
import { mat4, vec3 } from 'gl-matrix'
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

    if (this.mesh && this.mesh.vertices.length > 0) {
      this.updateWorldAABB()
    }

    this.children.forEach((child) => {
      child.updateTransformMatrix(this.transform.worldMatrix)
    })

    const colliders = this.getComponents(Collider)
    colliders.forEach((collider) => {
      collider.updateTransformMatrix()
    })
  }

  private updateWorldAABB() {
    const min = this.mesh.min
    const max = this.mesh.max

    // Check if mesh is valid/non-empty
    if (min[0] === Infinity) return

    const m = this.transform.worldMatrix

    // Center of local AABB
    const cx = (min[0] + max[0]) * 0.5
    const cy = (min[1] + max[1]) * 0.5
    const cz = (min[2] + max[2]) * 0.5

    // Extent of local AABB
    const ex = (max[0] - min[0]) * 0.5
    const ey = (max[1] - min[1]) * 0.5
    const ez = (max[2] - min[2]) * 0.5

    // Transform center: worldCenter = M * center
    const wc_x = m[0] * cx + m[4] * cy + m[8] * cz + m[12]
    const wc_y = m[1] * cx + m[5] * cy + m[9] * cz + m[13]
    const wc_z = m[2] * cx + m[6] * cy + m[10] * cz + m[14]

    // Transform extent (using absolute matrix values to get maximum extent)
    const wx = Math.abs(m[0]) * ex + Math.abs(m[4]) * ey + Math.abs(m[8]) * ez
    const wy = Math.abs(m[1]) * ex + Math.abs(m[5]) * ey + Math.abs(m[9]) * ez
    const wz = Math.abs(m[2]) * ex + Math.abs(m[6]) * ey + Math.abs(m[10]) * ez

    this.worldMin[0] = wc_x - wx
    this.worldMin[1] = wc_y - wy
    this.worldMin[2] = wc_z - wz

    this.worldMax[0] = wc_x + wx
    this.worldMax[1] = wc_y + wy
    this.worldMax[2] = wc_z + wz
  }
}
