import { vec3 } from 'gl-matrix'
import type { SphereCollider } from '../collisions/sphereCollider'
import { CollisionPoints } from '../collisions/collisionPoints'
import type { PlaneCollider } from '../collisions/planeCollider'
import type { BoxCollider } from '../collisions/boxCollider'

export default class CollisionsHelper {
  static getSphereSphereCollision(sphere1: SphereCollider, sphere2: SphereCollider): CollisionPoints {
    const distance = vec3.distance(sphere1.worldPosition, sphere2.worldPosition)
    const penetration = sphere1.radius + sphere2.radius - distance
    const normal = vec3.normalize(vec3.create(), vec3.subtract(vec3.create(), sphere1.worldPosition, sphere2.worldPosition))
    const contactPoint1 = vec3.scale(vec3.create(), normal, sphere1.radius - penetration / 2)
    const contactPoint2 = vec3.scale(vec3.create(), vec3.negate(normal, normal), sphere2.radius - penetration / 2)
    return new CollisionPoints(contactPoint1, contactPoint2, normal, penetration)
  }

  static getSpherePlaneCollision(sphere: SphereCollider, plane: PlaneCollider): CollisionPoints {
    const normal = vec3.normalize(vec3.create(), plane.planeNormal)
    const planeDistance = vec3.dot(normal, plane.worldPosition)
    const distance = vec3.dot(normal, sphere.worldPosition) - planeDistance
    const penetration = sphere.radius - distance
    const contactPoint = vec3.subtract(vec3.create(), sphere.worldPosition, vec3.scale(vec3.create(), normal, distance))
    return new CollisionPoints(contactPoint, contactPoint, vec3.negate(normal, normal), penetration)
  }

  static getBoxBoxCollision(box1: BoxCollider, box2: BoxCollider): CollisionPoints {
    const penetration = 0
    const normal = vec3.create()
    const contactPoint1 = vec3.create()
    const contactPoint2 = vec3.create()
    return new CollisionPoints(contactPoint1, contactPoint2, normal, penetration)
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
    const penetration = 0
    const normal = vec3.create()
    const contactPoint1 = vec3.create()
    const contactPoint2 = vec3.create()
    return new CollisionPoints(contactPoint1, contactPoint2, normal, penetration)
  }

  static getPlaneBoxCollision(plane: PlaneCollider, box: BoxCollider): CollisionPoints {
    const penetration = 0
    const normal = vec3.create()
    const contactPoint1 = vec3.create()
    const contactPoint2 = vec3.create()
    return new CollisionPoints(contactPoint1, contactPoint2, normal, penetration)
  }
}
