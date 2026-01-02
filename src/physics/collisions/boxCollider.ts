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
    console.log(
      `BOX_TEST: A=[${this.transform.position[0].toFixed(2)},${this.transform.position[1].toFixed(2)},${this.transform.position[2].toFixed(
        2
      )}] size=[${this.size[0].toFixed(2)},${this.size[1].toFixed(2)},${this.size[2].toFixed(
        2
      )}] | B=[${collider.transform.position[0].toFixed(2)},${collider.transform.position[1].toFixed(
        2
      )},${collider.transform.position[2].toFixed(2)}] size=[${collider.size[0].toFixed(2)},${collider.size[1].toFixed(
        2
      )},${collider.size[2].toFixed(2)}]`
    )

    const manifold = CollisionsHelper.getBoxBoxCollision(this, collider)

    console.log(
      `MANIFOLD: ${manifold.hasCollision ? 'COLLISION' : 'NO_COLLISION'} normal=[${manifold.sharedNormal[0].toFixed(
        2
      )},${manifold.sharedNormal[1].toFixed(2)},${manifold.sharedNormal[2].toFixed(2)}] points=${manifold.points.length}`
    )

    if (!manifold.hasCollision) return new CollisionPoints(vec3.create(), vec3.create(), vec3.create(), 0)

    // Convert manifold to CollisionPoints for backward compatibility
    if (manifold.points.length > 0) {
      // Use the first contact point for now, or average multiple points
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

      const result = new CollisionPoints(avgA, avgB, manifold.sharedNormal, avgDepth)
      console.log(
        `COLLISION_RESULT: normal=[${result.normal[0].toFixed(2)},${result.normal[1].toFixed(2)},${result.normal[2].toFixed(
          2
        )}] A=[${result.a[0].toFixed(2)},${result.a[1].toFixed(2)},${result.a[2].toFixed(2)}] B=[${result.b[0].toFixed(
          2
        )},${result.b[1].toFixed(2)},${result.b[2].toFixed(2)}] depth=${result.depth.toFixed(3)}`
      )
      return result
    }

    return new CollisionPoints(vec3.create(), vec3.create(), vec3.create(), 0)
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
