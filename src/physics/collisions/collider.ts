import { Component, EditorProp, EditorPropType } from '@/models/component'
import type { CollisionPoints } from './collisionPoints'
import { mat3, mat4, vec3 } from 'gl-matrix'
import { Mesh } from '@/models/mesh'
import { Transform } from '@/models/transform'

export class Collider extends Component {
  public transform: Transform
  public mesh: Mesh
  public min: vec3
  public max: vec3

  constructor() {
    super()
    this.transform = new Transform()
    this.mesh = new Mesh('Mesh')
    this.min = vec3.create()
    this.max = vec3.create()
    this.addEditorProp(new EditorProp('position', EditorPropType.vec3))
  }

  public get position() {
    return this.transform.position
  }

  public get worldPosition() {
    return this.transform.worldPosition
  }

  public updateTransformMatrix(matrix?: mat4) {
    this.transform.updateWorldMatrix(matrix)
  }

  public testCollision<T extends Collider>(collider: T): CollisionPoints {
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
