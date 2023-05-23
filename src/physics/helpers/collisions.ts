import { vec3 } from 'gl-matrix'
import type { SphereCollider } from '../collisions/sphereCollider'
import { CollisionPoints } from '../collisions/collisionPoints'
import type { PlaneCollider } from '../collisions/planeCollider'

export default class CollisionsHelper {
  static getSphereSphereCollision(sphere1: SphereCollider, sphere2: SphereCollider): CollisionPoints {
    const distance = vec3.distance(sphere1.center, sphere2.center)
    const sumRadius = sphere1.radius + sphere2.radius
    const penetration = sumRadius - distance
    const normal = vec3.normalize(vec3.create(), vec3.subtract(vec3.create(), sphere1.center, sphere2.center))
    const contactPoint = vec3.scale(vec3.create(), normal, sphere1.radius - penetration / 2)
    return new CollisionPoints(contactPoint, contactPoint, normal, penetration)
  }

  static getSpherePlaneCollision(sphere: SphereCollider, plane: PlaneCollider): CollisionPoints {
    const distance = vec3.dot(plane.plane, sphere.center) - plane.distance
    const penetration = sphere.radius - distance
    const normal = vec3.normalize(vec3.create(), plane.plane)
    const contactPoint = vec3.scale(vec3.create(), normal, sphere.radius - penetration / 2)
    return new CollisionPoints(contactPoint, contactPoint, normal, penetration)
  }

  static getPlaneSphereCollision(plane: PlaneCollider, sphere: SphereCollider): CollisionPoints {
    const distance = vec3.dot(plane.plane, sphere.center) - plane.distance
    const penetration = sphere.radius - distance
    const normal = vec3.normalize(vec3.create(), plane.plane)
    const contactPoint = vec3.scale(vec3.create(), normal, sphere.radius - penetration / 2)
    return new CollisionPoints(contactPoint, contactPoint, normal, penetration)
  }
}
