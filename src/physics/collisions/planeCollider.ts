import { vec3 } from 'gl-matrix'
import { Collider } from './collider'
import CollisionsHelper from '../helpers/collisions'
import { SphereCollider } from './sphereCollider'
import type { CollisionPoints } from './collisionPoints'
import { EditorProp, EditorPropType } from '@/models/component'
import Primitives from '@/helpers/primitives'

export class PlaneCollider extends Collider {
  constructor(width: number = 1, height: number = 1) {
    super()
    this.mesh = Primitives.createPlane(width, height)
    this.addEditorProp(new EditorProp('rotation', EditorPropType.vec3))
    this.addEditorProp(new EditorProp('scale', EditorPropType.vec3))
  }

  public get normal(): vec3 {
    return this.transform.getUpVectorWorld()
  }

  public get rotation(): vec3 {
    return this.transform.rotation
  }

  public get scale(): vec3 {
    return this.transform.scale
  }

  public get min(): vec3 {
    const min = vec3.fromValues(Infinity, Infinity, Infinity)

    this.mesh.vertices.forEach((vertex) => {
      vec3.min(min, min, this.transform.toWorldSpace(vertex))
    })

    return min
  }

  public get max(): vec3 {
    const max = vec3.fromValues(-Infinity, -Infinity, -Infinity)

    this.mesh.vertices.forEach((vertex) => {
      vec3.max(max, max, this.transform.toWorldSpace(vertex))
    })

    return max
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
    return CollisionsHelper.getSpherePlaneCollision(collider, this)
  }

  public testPlaneCollision(collider: PlaneCollider): CollisionPoints {
    throw new Error('Collision between planes not supported.')
  }
}
