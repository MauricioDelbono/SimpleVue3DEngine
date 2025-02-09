import { mat4, vec3 } from 'gl-matrix'
import { Collider } from './collider'
import CollisionsHelper from '../helpers/collisions'
import { SphereCollider } from './sphereCollider'
import type { CollisionPoints } from './collisionPoints'
import { EditorProp, EditorPropType } from '@/models/component'
import Primitives from '@/helpers/primitives'

export class PlaneCollider extends Collider {
  private planeNormal: vec3 = vec3.create()

  constructor(planeNormal: vec3 = vec3.fromValues(0, 1, 0), width: number = 20, height: number = 20) {
    super()
    this.planeNormal = planeNormal
    this.setMesh(Primitives.createPlane(width, height))
    this.addEditorProp(new EditorProp('planeNormal', EditorPropType.vec3, true))
  }

  public get normal(): vec3 {
    const worldNormal = vec3.transformMat4(vec3.create(), this.planeNormal, mat4.fromQuat(mat4.create(), this.transform.worldRotation))
    return vec3.normalize(vec3.create(), worldNormal)
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
