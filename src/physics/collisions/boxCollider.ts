import { vec3 } from 'gl-matrix'
import { Collider } from './collider'
import { CollisionPoints } from './collisionPoints'
import { PlaneCollider } from './planeCollider'
import { SphereCollider } from './sphereCollider'
import CollisionsHelper from '../helpers/collisions'
import { Manifold } from './manifold'
import type { mat4 } from 'gl-matrix'
import { ShapeFactory } from '../helpers/shape'
import { gjk, epa } from '../helpers/gjk'
import Primitives from '@/helpers/primitives'
import { EditorProp, EditorPropType } from '@/models/component'

export class BoxCollider extends Collider {
  public size: vec3 = vec3.fromValues(1, 1, 1)
  public worldVertices: vec3[] = []

  constructor(center: vec3 = vec3.fromValues(0, 0, 0)) {
    super()
    this.transform.position = center
    this.mesh = Primitives.createCube()

    this.addEditorProp(new EditorProp('scale', EditorPropType.vec3))
  }

  public get scale(): vec3 {
    return this.transform.scale
  }

  public updateTransformMatrix(matrix?: mat4) {
    // Sync with entity's transform first
    if (this.entity) {
      vec3.copy(this.transform.position, this.entity.transform.position)
      vec3.copy(this.transform.rotation, this.entity.transform.rotation)
      vec3.copy(this.transform.scale, this.entity.transform.scale)
    }

    this.transform.updateWorldMatrix(matrix)

    // Calculate world space min/max bounds
    this.worldVertices = []
    this.min = vec3.fromValues(Infinity, Infinity, Infinity)
    this.max = vec3.fromValues(-Infinity, -Infinity, -Infinity)
    this.mesh.vertices.forEach((vertex) => {
      this.worldVertices.push(this.transform.toWorldSpace(vertex))
      vec3.min(this.min, this.min, this.worldVertices[this.worldVertices.length - 1])
      vec3.max(this.max, this.max, this.worldVertices[this.worldVertices.length - 1])
    })
  }

  public getInertiaTensor(mass: number): number {
    const scale = this.entity?.transform.scale ?? this.transform.scale
    const wx = this.size[0] * Math.abs(scale[0])
    const wy = this.size[1] * Math.abs(scale[1])
    const wz = this.size[2] * Math.abs(scale[2])
    return mass * (wx * wx + wy * wy + wz * wz) / 18
  }

  public testCollision<T extends Collider>(collider: T): CollisionPoints {
    switch (collider.constructor) {
      case BoxCollider:
        return this.testBoxCollision(collider as unknown as BoxCollider)
      case PlaneCollider:
        return this.testPlaneCollision(collider as unknown as PlaneCollider)
      case SphereCollider:
        return this.testSphereCollision(collider as unknown as SphereCollider)
      default:
        // Use generic GJK/EPA for unknown collider types
        return this.testGenericCollision(collider)
    }
  }

  public testBoxCollision(collider: BoxCollider): CollisionPoints {
    const manifold = CollisionsHelper.getBoxBoxCollision(this, collider)

    if (!manifold.hasCollision) return new CollisionPoints(vec3.create(), vec3.create(), vec3.create(), -1)

    if (manifold.points.length > 0) {
      const avgA = vec3.create(),
        avgB = vec3.create()
      let avgDepth = 0
      manifold.points.forEach((p) => {
        vec3.add(avgA, avgA, p.a)
        vec3.add(avgB, avgB, p.b)
        avgDepth += p.depth
      })
      vec3.scale(avgA, avgA, 1 / manifold.points.length)
      vec3.scale(avgB, avgB, 1 / manifold.points.length)
      avgDepth /= manifold.points.length

      return new CollisionPoints(avgA, avgB, manifold.sharedNormal, avgDepth)
    }

    return new CollisionPoints(vec3.create(), vec3.create(), vec3.create(), -1)
  }

  public override testCollisionManifold<T extends Collider>(collider: T): Manifold {
    if (collider instanceof BoxCollider) {
      return CollisionsHelper.getBoxBoxCollision(this, collider)
    }
    return super.testCollisionManifold(collider)
  }

  public testGenericCollision(collider: Collider): CollisionPoints {
    // Create shapes from both colliders
    const shapeA = ShapeFactory.createFromCollider(this)
    const shapeB = ShapeFactory.createFromCollider(collider)

    // Use GJK/EPA for generic collision detection
    const gjkResult = gjk(shapeA, shapeB)
    if (!gjkResult.intersects || !gjkResult.simplex) {
      return new CollisionPoints(vec3.create(), vec3.create(), vec3.create(), -1)
    }

    return epa(shapeA, shapeB, gjkResult.simplex)
  }

  public testSphereCollision(collider: SphereCollider): CollisionPoints {
    return CollisionsHelper.getBoxSphereCollision(this, collider)
  }

  public testPlaneCollision(collider: PlaneCollider): CollisionPoints {
    return CollisionsHelper.getBoxPlaneCollision(this, collider)
  }

  // Utility method to create a Shape representation of this collider
  public toShape() {
    return ShapeFactory.createFromCollider(this)
  }
}
