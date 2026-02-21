import { mat3, mat4, vec3, vec4 } from 'gl-matrix'
import type { Transform } from '@/models/transform'
import type { BoxCollider } from '@/physics/collisions/boxCollider'
import type { SphereCollider } from '@/physics/collisions/sphereCollider'

/**
 * Flexible GJK/EPA Collision Detection System
 *
 * This system allows for collision detection between any convex shapes by implementing
 * the Shape interface. The key requirement is implementing a support function that
 * returns the furthest point in a given direction.
 *
 * @example Adding a new convex shape:
 * ```typescript
 * export class TetrahedronShape implements Shape {
 *   constructor(private vertices: vec3[]) {}
 *
 *   support(direction: vec3): vec3 {
 *     let maxDot = -Infinity
 *     let result = this.vertices[0]
 *
 *     for (const vertex of this.vertices) {
 *       const dot = vec3.dot(vertex, direction)
 *       if (dot > maxDot) {
 *         maxDot = dot
 *         result = vertex
 *       }
 *     }
 *     return vec3.copy(vec3.create(), result)
 *   }
 *
 *   getCenter(): vec3 { /* ... * / }
 *   getRadius(): number { /* ... * / }
 *   getType(): string { return 'Tetrahedron' }
 * }
 * ```
 *
 * Once implemented, the shape automatically works with GJK/EPA collision detection
 * for any other convex shape in the system.
 */
// Base interface for all convex shapes used in GJK/EPA
export interface Shape {
  // Support function: returns the furthest point in a given direction
  support(direction: vec3): vec3

  // Get approximate center for better GJK initialization
  getCenter(): vec3

  // Get approximate radius for broad phase optimizations
  getRadius(): number

  // Get shape type for debugging/optimization
  getType(): string
}

// Box shape implementation
export class BoxShape implements Shape {
  private transform: Transform
  private extents: vec3 // Half-sizes
  private center: vec3 // Local center offset
  private _transformMatrix: mat4

  constructor(transform: Transform, size: vec3, center: vec3 = vec3.fromValues(0, 0, 0)) {
    this.transform = transform
    this.extents = vec3.scale(vec3.create(), size, 0.5)
    this.center = vec3.copy(vec3.create(), center)
    this._transformMatrix = mat4.create()

    this.updateTransform()
  }

  public updateTransform() {
    // Ensure the transform's world matrix is up to date
    this.transform.updateWorldMatrix()
    // Then copy it to our internal matrix
    mat4.copy(this._transformMatrix, this.transform.worldMatrix)
  }

  public support(direction: vec3): vec3 {
    this.updateTransform()

    // Transform direction to local space as a DIRECTION (w=0), not a point.
    // Using mat3 (upper-left 3x3 of the inverse) strips translation,
    // which would otherwise corrupt the direction for objects far from the origin.
    const invTransform = mat4.invert(mat4.create(), this._transformMatrix)
    const invRotScale = mat3.fromMat4(mat3.create(), invTransform)
    const localDir = vec3.transformMat3(vec3.create(), direction, invRotScale)
    vec3.normalize(localDir, localDir)

    // Select the vertex that is furthest in localDir.
    // Avoid Math.sign(0)=0 which would produce a face-center instead of a vertex.
    const localSupport = vec3.fromValues(
      (localDir[0] >= 0 ? 1 : -1) * this.extents[0],
      (localDir[1] >= 0 ? 1 : -1) * this.extents[1],
      (localDir[2] >= 0 ? 1 : -1) * this.extents[2]
    )

    vec3.add(localSupport, localSupport, this.center)

    const worldSupport = vec3.create()
    vec3.transformMat4(worldSupport, localSupport, this._transformMatrix)
    return worldSupport
  }

  public getCenter(): vec3 {
    // Ensure transform is up to date before getting center
    this.updateTransform()
    // Transform the center offset to world space
    const worldCenter = this.transform.toWorldSpace(this.center)

    return worldCenter
  }

  public getRadius(): number {
    return vec3.length(this.extents)
  }

  public getType(): string {
    return 'Box'
  }

  // Additional methods for SAT as fallback
  public getAxes(): vec3[] {
    // Ensure transform is up to date
    this.updateTransform()
    return [this.transform.getRightVectorWorld(), this.transform.getUpVectorWorld(), this.transform.getForwardVectorWorld()]
  }

  public getExtents(): vec3 {
    const worldScale = this.transform.worldScale
    return vec3.fromValues(
      this.extents[0] * Math.abs(worldScale[0]),
      this.extents[1] * Math.abs(worldScale[1]),
      this.extents[2] * Math.abs(worldScale[2])
    )
  }
}

// Sphere shape implementation
export class SphereShape implements Shape {
  private center: vec3
  private radius: number

  constructor(center: vec3, radius: number) {
    this.center = vec3.copy(vec3.create(), center)
    this.radius = radius
  }

  public support(direction: vec3): vec3 {
    const normalizedDir = vec3.normalize(vec3.create(), direction)
    const support = vec3.scaleAndAdd(vec3.create(), this.center, normalizedDir, this.radius)
    return support
  }

  public getCenter(): vec3 {
    return vec3.copy(vec3.create(), this.center)
  }

  public getRadius(): number {
    return this.radius
  }

  public getType(): string {
    return 'Sphere'
  }

  public updateCenter(newCenter: vec3) {
    vec3.copy(this.center, newCenter)
  }
}

// Capsule shape implementation (cylinder with hemisphere caps)
export class CapsuleShape implements Shape {
  private center: vec3
  private axis: vec3 // Normalized axis direction
  private height: number // Distance between hemisphere centers
  private radius: number

  constructor(center: vec3, axis: vec3, height: number, radius: number) {
    this.center = vec3.copy(vec3.create(), center)
    this.axis = vec3.normalize(vec3.create(), axis)
    this.height = height
    this.radius = radius
  }

  public support(direction: vec3): vec3 {
    // Project direction onto capsule axis
    const dirDotAxis = vec3.dot(direction, this.axis)

    // Choose the appropriate hemisphere center
    const hemisphereCenter = vec3.create()
    const sign = Math.sign(dirDotAxis)
    vec3.scaleAndAdd(hemisphereCenter, this.center, this.axis, sign * this.height * 0.5)

    // Return furthest point on hemisphere
    const normalizedDir = vec3.normalize(vec3.create(), direction)
    const support = vec3.scaleAndAdd(vec3.create(), hemisphereCenter, normalizedDir, this.radius)
    return support
  }

  public getCenter(): vec3 {
    return vec3.copy(vec3.create(), this.center)
  }

  public getRadius(): number {
    return this.radius + this.height * 0.5
  }

  public getType(): string {
    return 'Capsule'
  }
}

// Cylinder shape implementation (example of extensibility)
export class CylinderShape implements Shape {
  private center: vec3
  private axis: vec3 // Normalized axis direction (usually Y)
  private height: number
  private radius: number

  constructor(center: vec3, axis: vec3, height: number, radius: number) {
    this.center = vec3.copy(vec3.create(), center)
    this.axis = vec3.normalize(vec3.create(), axis)
    this.height = height
    this.radius = radius
  }

  public support(direction: vec3): vec3 {
    // Project direction onto cylinder axis
    const dirDotAxis = vec3.dot(direction, this.axis)

    // Get the radial component (perpendicular to axis)
    const radialDir = vec3.create()
    vec3.scaleAndAdd(radialDir, direction, this.axis, -dirDotAxis)
    const radialLength = vec3.length(radialDir)

    // Support point starts at appropriate end of cylinder
    const support = vec3.create()
    vec3.scaleAndAdd(support, this.center, this.axis, Math.sign(dirDotAxis) * this.height * 0.5)

    // Add radial component if direction has radial part
    if (radialLength > 1e-6) {
      vec3.normalize(radialDir, radialDir)
      vec3.scaleAndAdd(support, support, radialDir, this.radius)
    }

    return support
  }

  public getCenter(): vec3 {
    return vec3.copy(vec3.create(), this.center)
  }

  public getRadius(): number {
    return Math.max(this.radius, this.height * 0.5)
  }

  public getType(): string {
    return 'Cylinder'
  }
}

// Convex hull shape implementation for arbitrary convex meshes
export class ConvexHullShape implements Shape {
  private vertices: vec3[]
  private center: vec3
  private radius: number

  constructor(vertices: vec3[]) {
    this.vertices = vertices.map((v) => vec3.copy(vec3.create(), v))
    this.center = this.computeCenter()
    this.radius = this.computeRadius()
  }

  public support(direction: vec3): vec3 {
    let maxDot = -Infinity
    let result = this.vertices[0]

    for (const vertex of this.vertices) {
      const dot = vec3.dot(vertex, direction)
      if (dot > maxDot) {
        maxDot = dot
        result = vertex
      }
    }

    return vec3.copy(vec3.create(), result)
  }

  public getCenter(): vec3 {
    return vec3.copy(vec3.create(), this.center)
  }

  public getRadius(): number {
    return this.radius
  }

  public getType(): string {
    return 'ConvexHull'
  }

  private computeCenter(): vec3 {
    const center = vec3.create()
    for (const vertex of this.vertices) {
      vec3.add(center, center, vertex)
    }
    vec3.scale(center, center, 1 / this.vertices.length)
    return center
  }

  private computeRadius(): number {
    let maxDist = 0
    for (const vertex of this.vertices) {
      const dist = vec3.distance(vertex, this.center)
      maxDist = Math.max(maxDist, dist)
    }
    return maxDist
  }

  public getVertices(): vec3[] {
    return this.vertices.map((v) => vec3.copy(vec3.create(), v))
  }
}

// Factory to create shapes from colliders
export class ShapeFactory {
  static createFromCollider(collider: any): Shape {
    // Update transform to ensure we have latest world position
    if (collider.updateTransformMatrix) {
      collider.updateTransformMatrix()
    }

    if (collider.constructor.name === 'BoxCollider') {
      const boxCollider = collider as BoxCollider
      // Ensure the collider's transform is updated before creating the shape
      boxCollider.updateTransformMatrix()
      // Use local size for BoxShape - transform handles scaling
      const shape = new BoxShape(boxCollider.transform, boxCollider.size)
      // Ensure the shape has the latest transform matrix
      shape.updateTransform()
      return shape
    }

    if (collider.constructor.name === 'SphereCollider') {
      const sphereCollider = collider as SphereCollider
      return new SphereShape(sphereCollider.worldPosition, sphereCollider.radius)
    }

    if (collider.constructor.name === 'MeshCollider') {
      // For mesh colliders, determine the type and create appropriate shape
      const meshCollider = collider as any // MeshCollider

      if (meshCollider.type === 0) {
        // MeshTypes.BOX
        // Ensure the collider's transform is updated before creating the shape
        meshCollider.updateTransformMatrix()
        // Create a box shape from mesh collider bounds
        const center = meshCollider.transform.worldPosition
        // The MeshCollider already uses scale directly as size, so no need to multiply by 2
        const size = vec3.copy(vec3.create(), meshCollider.transform.scale)
        const shape = new BoxShape(meshCollider.transform, size)
        // Ensure the shape has the latest transform matrix
        shape.updateTransform()
        return shape
      }

      // For other mesh types, create a sphere approximation
      const center = meshCollider.transform.worldPosition || vec3.create()
      const avgScale = (meshCollider.transform.scale[0] + meshCollider.transform.scale[1] + meshCollider.transform.scale[2]) / 3
      return new SphereShape(center, avgScale)
    }

    // Fallback: treat as sphere with bounding radius
    const center = collider.worldPosition || vec3.create()
    const radius = 1.0 // Default radius
    console.warn(`Unknown collider type: ${collider.constructor.name}, using sphere fallback`)
    return new SphereShape(center, radius)
  }

  static createBox(transform: Transform, size: vec3): BoxShape {
    return new BoxShape(transform, size)
  }

  static createSphere(center: vec3, radius: number): SphereShape {
    return new SphereShape(center, radius)
  }

  static createCapsule(center: vec3, axis: vec3, height: number, radius: number): CapsuleShape {
    return new CapsuleShape(center, axis, height, radius)
  }

  static createCylinder(center: vec3, axis: vec3, height: number, radius: number): CylinderShape {
    return new CylinderShape(center, axis, height, radius)
  }

  // Utility method to determine if two shapes should use GJK or specialized algorithms
  static shouldUseGJK(shapeA: Shape, shapeB: Shape): boolean {
    const typeA = shapeA.getType()
    const typeB = shapeB.getType()

    // Use specialized algorithms for certain combinations
    if (typeA === 'Sphere' && typeB === 'Sphere') {
      return false // Use specialized sphere-sphere collision
    }

    if (typeA === 'Box' && typeB === 'Box' && shapeA instanceof BoxShape && shapeB instanceof BoxShape) {
      // Check if boxes are axis-aligned for SAT optimization
      const axesA = shapeA.getAxes()
      const axesB = shapeB.getAxes()

      const worldX = vec3.fromValues(1, 0, 0)
      const worldY = vec3.fromValues(0, 1, 0)
      const worldZ = vec3.fromValues(0, 0, 1)
      const threshold = 0.95 // cos(~18 degrees)

      let isAxisAligned = true
      for (const axis of [...axesA, ...axesB]) {
        const dotX = Math.abs(vec3.dot(axis, worldX))
        const dotY = Math.abs(vec3.dot(axis, worldY))
        const dotZ = Math.abs(vec3.dot(axis, worldZ))

        if (dotX < threshold && dotY < threshold && dotZ < threshold) {
          isAxisAligned = false
          break
        }
      }

      return !isAxisAligned // Use SAT for axis-aligned, GJK for rotated
    }

    // Default to GJK for general convex shape collisions
    return true
  }
}

// Minkowski difference support function for GJK
export function minkowskiSupport(shapeA: Shape, shapeB: Shape, direction: vec3): vec3 {
  const supportA = shapeA.support(direction)
  const negDirection = vec3.negate(vec3.create(), direction)
  const supportB = shapeB.support(negDirection)
  return vec3.subtract(vec3.create(), supportA, supportB)
}

// Utility functions for shape collision testing
export class ShapeCollisionUtil {
  /**
   * Test collision between any two convex shapes using GJK/EPA
   * @param shapeA First shape
   * @param shapeB Second shape
   * @returns CollisionPoints with contact information, or null if no collision
   */
  static testCollision(shapeA: Shape, shapeB: Shape): any /* CollisionPoints */ | null {
    // Note: In a real implementation, you would import gjk and epa functions
    // For now, this is a placeholder showing the interface

    return null
  }

  /**
   * Quick intersection test between two shapes (no contact details)
   * @param shapeA First shape
   * @param shapeB Second shape
   * @returns true if shapes intersect, false otherwise
   */
  static intersects(shapeA: Shape, shapeB: Shape): boolean {
    // Note: In a real implementation, you would import gjk function
    // For now, this is a placeholder showing the interface

    return false
  }

  /**
   * Get the distance between two shapes (negative if overlapping)
   * @param shapeA First shape
   * @param shapeB Second shape
   * @returns Distance between shapes, negative if overlapping
   */
  static distance(shapeA: Shape, shapeB: Shape): number {
    const collision = this.testCollision(shapeA, shapeB)
    if (collision && collision.depth > 0) {
      return -collision.depth // Negative for penetration
    }

    // For non-intersecting shapes, we'd need a different algorithm
    // For now, return a large positive value
    return Infinity
  }

  /**
   * Create a shape from a simple convex hull (array of vertices)
   * @param vertices Array of vertices defining the convex hull
   * @returns ConvexHullShape that can be used with GJK/EPA
   */
  static createConvexHull(vertices: vec3[]): Shape {
    return new ConvexHullShape(vertices)
  }
}
