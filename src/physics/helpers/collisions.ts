import { vec3 } from 'gl-matrix'
import type { SphereCollider } from '../collisions/sphereCollider'
import { CollisionPoints } from '../collisions/collisionPoints'
import type { PlaneCollider } from '../collisions/planeCollider'
import type { BoxCollider } from '../collisions/boxCollider'
import type { MeshCollider } from '../collisions/meshCollider'
import { epa, gjk } from './gjk'
import { Manifold, ContactPoint } from '../collisions/manifold'
import { ShapeFactory, BoxShape } from './shape'
import type { Shape } from './shape'

export default class CollisionsHelper {
  static getSphereSphereCollision(sphere1: SphereCollider, sphere2: SphereCollider): CollisionPoints {
    const distance = vec3.distance(sphere1.worldPosition, sphere2.worldPosition)
    const penetration = sphere1.radius + sphere2.radius - distance
    const normal = vec3.normalize(vec3.create(), vec3.subtract(vec3.create(), sphere1.worldPosition, sphere2.worldPosition))
    const contactPoint1 = vec3.scale(vec3.create(), vec3.negate(normal, normal), sphere1.radius)
    const contactPoint2 = vec3.scale(vec3.create(), normal, sphere2.radius)
    return new CollisionPoints(contactPoint1, contactPoint2, normal, penetration)
  }

  static getSpherePlaneCollision(sphere: SphereCollider, plane: PlaneCollider): CollisionPoints {
    const penetration = 0
    const normal = vec3.create()
    const contactPoint1 = vec3.create()
    const contactPoint2 = vec3.create()
    return new CollisionPoints(contactPoint1, contactPoint2, normal, penetration)
  }

  static getPlanePlaneCollision(plane1: PlaneCollider, plane2: PlaneCollider): CollisionPoints {
    const penetration = -1
    const normal = vec3.create()
    const contactPoint1 = vec3.create()
    const contactPoint2 = vec3.create()
    return new CollisionPoints(contactPoint1, contactPoint2, normal, penetration)
  }

  static getMeshMeshCollision(mesh1: MeshCollider, mesh2: MeshCollider): CollisionPoints {
    // Convert mesh colliders to shapes and use GJK/EPA
    const shapeA = ShapeFactory.createFromCollider(mesh1)
    const shapeB = ShapeFactory.createFromCollider(mesh2)

    return this.getShapeShapeCollision(shapeA, shapeB)
  }

  static getBoxBoxCollision(box: BoxCollider, otherBox: BoxCollider): Manifold {
    // Create BoxShape objects for more accurate collision detection
    const shapeA = new BoxShape(box.transform, box.size)
    const shapeB = new BoxShape(otherBox.transform, otherBox.size)

    // Update transforms
    shapeA.updateTransform()
    shapeB.updateTransform()

    // For boxes, we can use either GJK/EPA or SAT - let's use GJK/EPA for consistency
    // but fall back to SAT for performance if shapes are axis-aligned
    const useGJK = this.shouldUseGJK(shapeA, shapeB)

    if (useGJK) {
      return this.getBoxBoxCollisionGJK(shapeA, shapeB)
    } else {
      return this.getBoxBoxCollisionSAT(shapeA, shapeB)
    }
  }

  private static shouldUseGJK(boxA: BoxShape, boxB: BoxShape): boolean {
    // Use GJK for rotated boxes, SAT for axis-aligned boxes
    const axesA = boxA.getAxes()
    const axesB = boxB.getAxes()

    // Check if either box is significantly rotated
    const worldX = vec3.fromValues(1, 0, 0)
    const worldY = vec3.fromValues(0, 1, 0)
    const worldZ = vec3.fromValues(0, 0, 1)

    const threshold = 0.95 // cos(~18 degrees)

    const allAxes = [...axesA, ...axesB]
    for (let i = 0; i < allAxes.length; i++) {
      const axis = allAxes[i]
      const dotX = Math.abs(vec3.dot(axis, worldX))
      const dotY = Math.abs(vec3.dot(axis, worldY))
      const dotZ = Math.abs(vec3.dot(axis, worldZ))

      if (dotX < threshold && dotY < threshold && dotZ < threshold) {
        return true // Box is rotated, use GJK
      }
    }

    return false // Boxes are roughly axis-aligned, use SAT
  }

  private static getBoxBoxCollisionGJK(shapeA: BoxShape, shapeB: BoxShape): Manifold {
    const manifold = new Manifold(vec3.create())

    // Run GJK for collision detection
    const gjkResult = gjk(shapeA, shapeB)
    if (!gjkResult.intersects || !gjkResult.simplex) {
      return manifold // No collision
    }

    // Run EPA to get penetration depth and normal (accurate)
    const contactPoints = epa(shapeA, shapeB, gjkResult.simplex)

    // Ensure normal points from A to B
    const centerA = shapeA.getCenter()
    const centerB = shapeB.getCenter()
    const centerToCenter = vec3.subtract(vec3.create(), centerB, centerA)
    const normal = vec3.copy(vec3.create(), contactPoints.normal)
    if (vec3.dot(normal, centerToCenter) < 0) {
      vec3.negate(normal, normal)
    }

    vec3.copy(manifold.sharedNormal, normal)

    // Generate geometrically accurate contact points using face-clipping
    // (EPA contact points are inaccurate for torque computation)
    const boxA = {
      center: centerA,
      extents: shapeA.getExtents(),
      axes: shapeA.getAxes()
    }
    const boxB = {
      center: centerB,
      extents: shapeB.getExtents(),
      axes: shapeB.getAxes()
    }

    this.generateFaceContacts(boxA, boxB, normal, contactPoints.depth, manifold)

    return manifold
  }

  private static getBoxBoxCollisionSAT(shapeA: BoxShape, shapeB: BoxShape): Manifold {
    const manifold = new Manifold(vec3.create())

    // Get box data for SAT
    const boxA = {
      center: shapeA.getCenter(),
      extents: shapeA.getExtents(),
      axes: shapeA.getAxes()
    }

    const boxB = {
      center: shapeB.getCenter(),
      extents: shapeB.getExtents(),
      axes: shapeB.getAxes()
    }

    // Test all 15 potential separating axes (6 face normals + 9 edge combinations)
    const allAxes = [
      ...boxA.axes, // Box A face normals (3)
      ...boxB.axes, // Box B face normals (3)
      // Edge cross products (9)
      vec3.cross(vec3.create(), boxA.axes[0], boxB.axes[0]),
      vec3.cross(vec3.create(), boxA.axes[0], boxB.axes[1]),
      vec3.cross(vec3.create(), boxA.axes[0], boxB.axes[2]),
      vec3.cross(vec3.create(), boxA.axes[1], boxB.axes[0]),
      vec3.cross(vec3.create(), boxA.axes[1], boxB.axes[1]),
      vec3.cross(vec3.create(), boxA.axes[1], boxB.axes[2]),
      vec3.cross(vec3.create(), boxA.axes[2], boxB.axes[0]),
      vec3.cross(vec3.create(), boxA.axes[2], boxB.axes[1]),
      vec3.cross(vec3.create(), boxA.axes[2], boxB.axes[2])
    ]

    let minOverlap = Infinity
    let minAxis: vec3 | null = null
    let axisIndex = -1

    for (let i = 0; i < allAxes.length; i++) {
      const axis = allAxes[i]

      // Skip near-zero axes (parallel edges)
      if (vec3.length(axis) < 1e-6) {
        continue
      }
      vec3.normalize(axis, axis)

      const overlap = this.getOverlapOnAxis(boxA, boxB, axis)

      if (overlap <= 0) {
        return manifold // Separating axis found, no collision
      }

      if (overlap < minOverlap) {
        minOverlap = overlap
        minAxis = vec3.copy(vec3.create(), axis)
        axisIndex = i
      }
    }

    if (!minAxis) {
      return manifold // No valid collision axis found
    }

    // Ensure normal points from A to B
    const centerToCenter = vec3.subtract(vec3.create(), boxB.center, boxA.center)
    if (vec3.dot(minAxis, centerToCenter) < 0) {
      vec3.negate(minAxis, minAxis)
    }

    vec3.copy(manifold.sharedNormal, minAxis)

    // Generate contact points based on the minimum overlap axis
    this.generateBoxContactPoints(boxA, boxB, minAxis, minOverlap, axisIndex, manifold)

    return manifold
  }

  // Generic shape-to-shape collision using GJK/EPA
  private static getShapeShapeCollision(shapeA: Shape, shapeB: Shape): CollisionPoints {
    // Run GJK for collision detection
    const gjkResult = gjk(shapeA, shapeB)
    if (!gjkResult.intersects || !gjkResult.simplex) {
      return new CollisionPoints(vec3.create(), vec3.create(), vec3.create(), -1)
    }

    // Run EPA to get contact information
    const contactPoints = epa(shapeA, shapeB, gjkResult.simplex)

    // Debug logging
    console.log(
      `COLLISION_DETECTED: depth=${contactPoints.depth.toFixed(3)} normal=[${contactPoints.normal[0].toFixed(
        2
      )},${contactPoints.normal[1].toFixed(2)},${contactPoints.normal[2].toFixed(2)}] A=[${contactPoints.a[0].toFixed(
        2
      )},${contactPoints.a[1].toFixed(2)},${contactPoints.a[2].toFixed(2)}] B=[${contactPoints.b[0].toFixed(
        2
      )},${contactPoints.b[1].toFixed(2)},${contactPoints.b[2].toFixed(2)}]`
    )

    return contactPoints
  }

  private static getOverlapOnAxis(boxA: any, boxB: any, axis: vec3): number {
    // Project both boxes onto the axis
    const projA = this.projectBoxOntoAxis(boxA, axis)
    const projB = this.projectBoxOntoAxis(boxB, axis)

    // Calculate overlap
    const overlap = Math.min(projA.max, projB.max) - Math.max(projA.min, projB.min)

    console.log(
      `OVERLAP: A=[${projA.min.toFixed(2)},${projA.max.toFixed(2)}] B=[${projB.min.toFixed(2)},${projB.max.toFixed(
        2
      )}] result=${overlap.toFixed(3)}`
    )

    return overlap
  }

  private static projectBoxOntoAxis(box: any, axis: vec3): { min: number; max: number } {
    // Project box center onto axis
    const centerProj = vec3.dot(box.center, axis)

    // Project box extents onto axis
    let radius = 0
    for (let i = 0; i < 3; i++) {
      radius += Math.abs(vec3.dot(box.axes[i], axis)) * box.extents[i]
    }

    return {
      min: centerProj - radius,
      max: centerProj + radius
    }
  }

  private static generateBoxContactPoints(boxA: any, boxB: any, normal: vec3, penetration: number, axisIndex: number, manifold: Manifold) {
    // For simplicity, generate 1-4 contact points based on the collision type

    if (axisIndex < 6) {
      // Face-to-face contact (face normal collision)
      this.generateFaceContacts(boxA, boxB, normal, penetration, manifold)
    } else {
      // Edge-to-edge contact
      this.generateEdgeContacts(boxA, boxB, normal, penetration, manifold)
    }
  }

  private static generateFaceContacts(boxA: any, boxB: any, normal: vec3, penetration: number, manifold: Manifold) {
    const faceA = this.getMostPerpendicularFace(boxA, normal)
    const faceB = this.getMostPerpendicularFace(boxB, vec3.negate(vec3.create(), normal))

    const dotA = Math.abs(vec3.dot(faceA.normal, normal))
    const dotB = Math.abs(vec3.dot(faceB.normal, normal))

    let referenceFace: { vertices: vec3[]; normal: vec3 }
    let incidentFace: { vertices: vec3[]; normal: vec3 }
    let referenceIsA: boolean

    if (dotA >= dotB) {
      referenceFace = faceA
      incidentFace = faceB
      referenceIsA = true
    } else {
      referenceFace = faceB
      incidentFace = faceA
      referenceIsA = false
    }

    const contactPoints = this.clipIncidentToReference(referenceFace, incidentFace, referenceIsA)

    contactPoints.slice(0, 4).forEach((point) => {
      manifold.addPoint(point.pointA, point.pointB, point.depth)
    })

    if (contactPoints.length === 0) {
      const contactPoint = vec3.create()
      vec3.lerp(contactPoint, boxA.center, boxB.center, 0.5)
      const contactA = vec3.scaleAndAdd(vec3.create(), contactPoint, normal, -penetration * 0.5)
      const contactB = vec3.scaleAndAdd(vec3.create(), contactPoint, normal, penetration * 0.5)
      manifold.addPoint(contactA, contactB, penetration)
    }
  }

  private static getMostPerpendicularFace(box: any, normal: vec3): { vertices: vec3[]; normal: vec3 } {
    // Find the face normal that's most aligned with the collision normal
    let bestDot = -1
    let bestAxis = 0

    for (let i = 0; i < 3; i++) {
      const dot = Math.abs(vec3.dot(box.axes[i], normal))
      if (dot > bestDot) {
        bestDot = dot
        bestAxis = i
      }
    }

    // Determine face direction (positive or negative)
    const faceNormal = vec3.copy(vec3.create(), box.axes[bestAxis])
    if (vec3.dot(faceNormal, normal) < 0) {
      vec3.negate(faceNormal, faceNormal)
    }

    // Generate the 4 vertices of this face
    const vertices = this.generateFaceVertices(box, bestAxis, vec3.dot(faceNormal, box.axes[bestAxis]) > 0)

    return { vertices, normal: faceNormal }
  }

  private static generateFaceVertices(box: any, axisIndex: number, positive: boolean): vec3[] {
    const vertices: vec3[] = []
    const sign = positive ? 1 : -1

    // Get the other two axes
    const axis1 = (axisIndex + 1) % 3
    const axis2 = (axisIndex + 2) % 3

    // Generate 4 corners of the face
    for (const s1 of [-1, 1]) {
      for (const s2 of [-1, 1]) {
        const vertex = vec3.copy(vec3.create(), box.center)
        vec3.scaleAndAdd(vertex, vertex, box.axes[axisIndex], sign * box.extents[axisIndex])
        vec3.scaleAndAdd(vertex, vertex, box.axes[axis1], s1 * box.extents[axis1])
        vec3.scaleAndAdd(vertex, vertex, box.axes[axis2], s2 * box.extents[axis2])
        vertices.push(vertex)
      }
    }

    return vertices
  }

  private static clipIncidentToReference(
    referenceFace: { vertices: vec3[]; normal: vec3 },
    incidentFace: { vertices: vec3[]; normal: vec3 },
    referenceIsA: boolean
  ): Array<{ pointA: vec3; pointB: vec3; depth: number }> {
    const contactPoints: Array<{ pointA: vec3; pointB: vec3; depth: number }> = []
    const refNormal = referenceFace.normal

    incidentFace.vertices.forEach((vertex: vec3) => {
      const toVertex = vec3.subtract(vec3.create(), vertex, referenceFace.vertices[0])
      const dist = vec3.dot(toVertex, refNormal)

      if (dist < 0) {
        const incidentPoint = vec3.copy(vec3.create(), vertex)
        const referencePoint = vec3.scaleAndAdd(vec3.create(), vertex, refNormal, -dist)
        const depth = Math.abs(dist)

        if (referenceIsA) {
          contactPoints.push({ pointA: referencePoint, pointB: incidentPoint, depth })
        } else {
          contactPoints.push({ pointA: incidentPoint, pointB: referencePoint, depth })
        }
      }
    })

    return contactPoints
  }

  private static generateEdgeContacts(boxA: any, boxB: any, normal: vec3, penetration: number, manifold: Manifold) {
    // Simple approach for edge contacts
    const contactPoint = vec3.create()
    vec3.lerp(contactPoint, boxA.center, boxB.center, 0.5)

    const contactA = vec3.scaleAndAdd(vec3.create(), contactPoint, normal, -penetration * 0.5)
    const contactB = vec3.scaleAndAdd(vec3.create(), contactPoint, normal, penetration * 0.5)

    manifold.addPoint(contactA, contactB, penetration)
  }

  static getBoxSphereCollision(box: BoxCollider, sphere: SphereCollider): CollisionPoints {
    const penetration = 0
    const normal = vec3.create()
    const contactPoint1 = vec3.create()
    const contactPoint2 = vec3.create()
    return new CollisionPoints(contactPoint1, contactPoint2, normal, penetration)
  }

  static getSphereBoxCollision(sphere: SphereCollider, box: BoxCollider): CollisionPoints {
    const penetration = 0
    const normal = vec3.create()
    const contactPoint1 = vec3.create()
    const contactPoint2 = vec3.create()
    return new CollisionPoints(contactPoint1, contactPoint2, normal, penetration)
  }

  static getBoxPlaneCollision(box: BoxCollider, plane: PlaneCollider): CollisionPoints {
    const normal = vec3.normalize(vec3.create(), plane.normal)
    const planeDistance = vec3.dot(plane.worldPosition, normal)
    let minDepth = Infinity
    let deepestPoint = vec3.create()
    const worldVertices: vec3[] = []
    const min = box.min
    const max = box.max
    for (const x of [min[0], max[0]]) {
      for (const y of [min[1], max[1]]) {
        for (const z of [min[2], max[2]]) {
          worldVertices.push(vec3.fromValues(x, y, z))
        }
      }
    }
    worldVertices.forEach((vertex: vec3) => {
      const distance = vec3.dot(vertex, normal) - planeDistance
      if (distance < minDepth) {
        minDepth = distance
        deepestPoint = vertex
      }
    })
    const penetration = -minDepth // positive if penetrating
    if (penetration <= 0) return new CollisionPoints(vec3.create(), vec3.create(), vec3.create(), -1)
    const contactA = vec3.subtract(vec3.create(), deepestPoint, vec3.scale(vec3.create(), normal, penetration))
    return new CollisionPoints(deepestPoint, contactA, vec3.negate(normal, normal), penetration)
  }

  static getPlaneBoxCollision(plane: PlaneCollider, box: BoxCollider): CollisionPoints {
    const penetration = 0
    const normal = vec3.create()
    const contactPoint1 = vec3.create()
    const contactPoint2 = vec3.create()
    return new CollisionPoints(contactPoint1, contactPoint2, normal, penetration)
  }

  private static getBoxVertices(box: BoxCollider): vec3[] {
    const vertices: vec3[] = []
    const min = box.min
    const max = box.max

    // Generate all 8 vertices of the box in world space
    for (const x of [min[0], max[0]]) {
      for (const y of [min[1], max[1]]) {
        for (const z of [min[2], max[2]]) {
          const localVertex = vec3.fromValues(x, y, z)
          const worldVertex = box.transform.toWorldSpace ? box.transform.toWorldSpace(localVertex) : localVertex
          vertices.push(worldVertex)
        }
      }
    }
    return vertices
  }
}
