import { mat3, mat4, vec3 } from 'gl-matrix'
import { Collider } from './collider'
import type { CollisionPoints } from './collisionPoints'
import CollisionsHelper from '../helpers/collisions'
import { PlaneCollider } from './planeCollider'
import { EditorProp, EditorPropType } from '@/models/component'
import Primitives from '@/helpers/primitives'
import { SphereTransform } from '@/models/sphereTransform'

export class SphereCollider extends Collider {
  constructor(radius: number = 1, center: vec3 = vec3.fromValues(0, 0, 0)) {
    super()
    this.transform = new SphereTransform()
    this.transform.position = center
    this.radiusScale = radius
    this.mesh = Primitives.createSphere(radius)
    this.addEditorProp(new EditorProp('radiusScale', EditorPropType.number))
  }

  public get radius(): number {
    return this.transform.worldScale[0]
  }

  public get radiusScale(): number {
    return this.transform.scale[0]
  }

  public set radiusScale(value) {
    this.transform.scale = vec3.fromValues(value, value, value)
  }

  public get min(): vec3 {
    const worldCenter = this.transform.toWorldSpace(this.transform.position)
    const worldMin = vec3.subtract(vec3.create(), worldCenter, vec3.fromValues(this.radius, this.radius, this.radius))
    return worldMin
  }

  public get max(): vec3 {
    const worldCenter = this.transform.toWorldSpace(this.transform.position)
    const worldMax = vec3.add(vec3.create(), worldCenter, vec3.fromValues(this.radius, this.radius, this.radius))
    return worldMax
  }

  public updateTransformMatrix(matrix?: mat4) {
    this.transform.updateWorldMatrix(matrix)
  }

  public testCollision<T extends Collider>(collider: T): CollisionPoints {
    switch (collider.constructor) {
      case PlaneCollider:
        return this.testPlaneCollision(collider as unknown as PlaneCollider)
      case SphereCollider:
        return this.testSphereCollision(collider as unknown as SphereCollider)
      default:
        throw new Error('Collider not supported')
    }
  }

  public testSphereCollision(collider: SphereCollider): CollisionPoints {
    return CollisionsHelper.getSphereSphereCollision(this, collider)
  }

  public testPlaneCollision(collider: PlaneCollider): CollisionPoints {
    return CollisionsHelper.getSpherePlaneCollision(this, collider)
  }

  public calculateInertiaTensor(mass: number): mat3 {
    const inertiaTensor = mat3.create()
    const coefficient = (2 / 5) * mass * this.radius * this.radius
    mat3.set(inertiaTensor, coefficient, 0, 0, 0, coefficient, 0, 0, 0, coefficient)
    return inertiaTensor
  }

  public getInertiaTensor(mass: number): number {
    return (2 / 5) * mass * this.radius * this.radius
  }
}
