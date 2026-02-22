import { mat3, mat4, vec3 } from 'gl-matrix'
import { Collider } from './collider'
import Primitives from '@/helpers/primitives'
import { EditorProp, EditorPropType } from '@/models/component'
import type { CollisionPoints } from './collisionPoints'
import { PlaneCollider } from './planeCollider'
import { SphereCollider } from './sphereCollider'
import CollisionsHelper from '../helpers/collisions'

export enum MeshTypes {
  BOX,
  CYLINDER,
  CONE,
  MESH
}

export class MeshCollider extends Collider {
  public type: MeshTypes
  public worldVertices: vec3[] = []

  constructor(type: MeshTypes = MeshTypes.BOX, center: vec3 = vec3.fromValues(0, 0, 0)) {
    super()
    this.type = type
    this.transform.position = center
    switch (type) {
      case MeshTypes.BOX:
        this.mesh = Primitives.createCube()
        break
      case MeshTypes.CYLINDER:
        this.mesh = Primitives.createCylinder()
        break
      default:
        this.mesh = Primitives.createCube()
    }

    this.addEditorProp(new EditorProp('scale', EditorPropType.vec3))
    this.addEditorProp(new EditorProp('meshType', EditorPropType.string, true))
  }

  public get meshType(): string {
    return this.type.toString()
  }

  public get scale(): vec3 {
    return this.transform.scale
  }

  public updateTransformMatrix(matrix?: mat4) {
    this.transform.updateWorldMatrix(matrix)

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
      case PlaneCollider:
        return this.testPlaneCollision(collider as unknown as PlaneCollider)
      case SphereCollider:
        return this.testSphereCollision(collider as unknown as SphereCollider)
      case MeshCollider:
        return this.testMeshCollision(collider as unknown as MeshCollider)
      default:
        throw new Error('Collider not supported')
    }
  }

  public testSphereCollision(collider: SphereCollider): CollisionPoints {
    throw new Error('Collision with spheres not supported.')
  }

  public testPlaneCollision(collider: PlaneCollider): CollisionPoints {
    throw new Error('Collision with planes not supported.')
  }

  public testMeshCollision(collider: MeshCollider): CollisionPoints {
    return CollisionsHelper.getMeshMeshCollision(this, collider)
  }

  public calculateInertiaTensor(mass: number): mat3 {
    const inertiaTensor = mat3.create()

    if (this.type === MeshTypes.BOX) {
      // Calculate box dimensions from scale
      const width = this.transform.scale[0] * 2 // Default cube is 2x2x2
      const height = this.transform.scale[1] * 2
      const depth = this.transform.scale[2] * 2

      // Box inertia tensor diagonal components: I = (mass/12) * (h² + d², w² + d², w² + h²)
      const Ixx = (mass / 12) * (height * height + depth * depth)
      const Iyy = (mass / 12) * (width * width + depth * depth)
      const Izz = (mass / 12) * (width * width + height * height)

      mat3.set(inertiaTensor, Ixx, 0, 0, 0, Iyy, 0, 0, 0, Izz)
    } else {
      // Fallback for other shapes - approximate as sphere
      const avgRadius = (this.transform.scale[0] + this.transform.scale[1] + this.transform.scale[2]) / 3
      const coefficient = (2 / 5) * mass * avgRadius * avgRadius
      mat3.set(inertiaTensor, coefficient, 0, 0, 0, coefficient, 0, 0, 0, coefficient)
    }

    return inertiaTensor
  }

  public getInertiaTensor(mass: number): number {
    // For simplified calculations, return a reasonable scalar approximation
    if (this.type === MeshTypes.BOX) {
      const avgScale = (this.transform.scale[0] + this.transform.scale[1] + this.transform.scale[2]) / 3
      return (mass * avgScale * avgScale) / 6 // Approximation for box
    }
    return mass
  }
}
