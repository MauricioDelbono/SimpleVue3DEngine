import { Component, EditorProp, EditorPropType } from '@/models/component'
import type { CollisionPoints } from './collisionPoints'
import { mat3, vec3 } from 'gl-matrix'
import { Mesh } from '@/models/mesh'
import { Transform } from '@/models/transform'

export class Collider extends Component {
  public transform: Transform
  public mesh: Mesh

  constructor() {
    super()
    this.mesh = new Mesh('Mesh')
    this.transform = new Transform()
    this.addEditorProp(new EditorProp('position', EditorPropType.vec3))
  }

  public setMesh(mesh: Mesh) {
    this.mesh = mesh
    this.transform = new Transform()
  }

  public get position() {
    return this.transform.position
  }

  public get worldPosition() {
    const worldPos = vec3.create()
    vec3.add(worldPos, this.transform.worldPosition, this.transform.position)
    return worldPos
  }

  public testCollision<T extends Collider>(collider: T): CollisionPoints {
    throw new Error('Not implemented in base class')
  }

  public get min(): vec3 {
    throw new Error('Not implemented in base class')
  }

  public get max(): vec3 {
    throw new Error('Not implemented in base class')
  }

  public intersects(collider: Collider): boolean {
    const overlapX = this.min[0] <= collider.max[0] && this.max[0] >= collider.min[0]
    const overlapY = this.min[1] <= collider.max[1] && this.max[1] >= collider.min[1]
    const overlapZ = this.min[2] <= collider.max[2] && this.max[2] >= collider.min[2]

    return overlapX && overlapY && overlapZ
  }

  public calculateInertiaTensor(mass: number): mat3 {
    throw new Error('Not implemented in base class')
  }

  public getInertiaTensor(mass: number): number {
    return Infinity
  }
}
