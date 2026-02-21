import { defineStore } from 'pinia'
import { useRenderStore } from './render'
import { vec3 } from 'gl-matrix'
import type { Solver } from '@/physics/dynamics/solver'
import { Collision } from '@/physics/collisions/collision'
import type { Rigidbody } from '@/physics/dynamics/rigidBody'
import { PositionSolver } from '@/physics/dynamics/positionSolver'
import { ImpulseSolver } from '@/physics/dynamics/impulseSolver'
import { CollisionPair } from '@/physics/collisions/collisionPair'
import type { Time } from '@/models/time'
import { Manifold } from '@/physics/collisions/manifold'
import { CollisionPoints } from '@/physics/collisions/collisionPoints'
import type { Collider } from '@/physics/collisions/collider'

export const usePhysicsStore = defineStore('physics', () => {
  const store = useRenderStore()

  const objects: Rigidbody[] = []
  const solvers: Solver[] = []
  const gravity = vec3.fromValues(0, -9.81, 0)
  const contactCache = new Map<string, { manifold: Manifold; age: number }>()

  function reset() {
    objects.splice(0, objects.length)
    solvers.splice(0, solvers.length)
    contactCache.clear()
    vec3.set(gravity, 0, -9.81, 0)
  }

  function initialize() {
    addSolver(new ImpulseSolver())
    addSolver(new PositionSolver())
    store.subscribeToRender({ update: step, lateUpdate: () => {} })
  }

  function addObject(object: Rigidbody) {
    objects.push(object)
  }

  function removeObject(object: Rigidbody) {
    const index = objects.indexOf(object)
    if (index > -1) {
      objects.splice(index, 1)
    }
  }

  function addSolver(solver: Solver) {
    solvers.push(solver)
  }

  function removeSolver(solver: Solver) {
    const index = solvers.indexOf(solver)
    if (index > -1) {
      solvers.splice(index, 1)
    }
  }

  function step(time: Time) {
    // Dynamics
    applyForces()
    updateObjects(time)

    // Collisions
    const collisionPairs = broadPhaseCollisions()
    const collisions = narrowPhaseCollisions(collisionPairs)
    resolveCollisions(time, collisions)
  }

  function applyForces() {
    objects.forEach((object) => {
      if (object.isStatic) return
      object.applyForce(vec3.scale(vec3.create(), gravity, object.mass))
    })
  }

  function updateObjects(time: Time) {
    objects.forEach((object) => {
      if (object.isStatic) return
      object.step(time)
    })
  }

  function broadPhaseCollisions() {
    const colliderPairs: CollisionPair[] = []
    // First iterate over all rigidbodies
    objects.slice().reverse().forEach((object, i) => {
      if (object.isStatic || object.isSleeping) return // Skip static and sleeping objects
      const objectColliders = object.colliders

      objects.forEach((otherObject, j) => {
        // skip self and already checked pairs
        if (object === otherObject || j >= objects.length - i) return
        // Skip if both objects are sleeping (no need to check sleeping vs sleeping)
        if (object.isSleeping && otherObject.isSleeping) return

        const otherObjectColliders = otherObject.colliders
        if (!objectColliders.length || !otherObjectColliders.length) return

        // Then iterate over all colliders of each of the rigidbodies
        objectColliders.forEach((collider) => {
          otherObjectColliders.forEach((otherCollider) => {
            // Check for potential tunneling with fast-moving objects
            const isFastMoving = vec3.length(object.velocity) > 10 || vec3.length(otherObject.velocity) > 10

            if (collider.intersects(otherCollider) || (isFastMoving && sweptIntersection(object, otherObject, collider, otherCollider))) {
              colliderPairs.push(new CollisionPair(object, otherObject, collider, otherCollider))
            }
          })
        })
      })
    })

    return colliderPairs
  }

  function sweptIntersection(bodyA: Rigidbody, bodyB: Rigidbody, colliderA: Collider, colliderB: Collider): boolean {
    // Simple swept intersection check using velocity projection
    const relativeVelocity = vec3.subtract(vec3.create(), bodyA.velocity, bodyB.velocity)
    const relativeSpeed = vec3.length(relativeVelocity)

    if (relativeSpeed < 1e-6) return false // Objects not moving relative to each other

    // Project positions forward by a fraction of the time step
    const timeStep = 1 / 60 // Assume 60 FPS
    const sweepTime = timeStep * 0.5 // Look ahead half a frame

    // Calculate future positions
    const futureA = vec3.scaleAndAdd(vec3.create(), bodyA.position, bodyA.velocity, sweepTime)
    const futureB = vec3.scaleAndAdd(vec3.create(), bodyB.position, bodyB.velocity, sweepTime)

    // Check if colliders would intersect at future positions
    const originalA = vec3.copy(vec3.create(), bodyA.position)
    const originalB = vec3.copy(vec3.create(), bodyB.position)

    // Temporarily move objects to future positions
    vec3.copy(bodyA.position, futureA)
    vec3.copy(bodyB.position, futureB)

    // Update collider transforms
    colliderA.updateTransformMatrix()
    colliderB.updateTransformMatrix()

    const willIntersect = colliderA.intersects(colliderB)

    // Restore original positions
    vec3.copy(bodyA.position, originalA)
    vec3.copy(bodyB.position, originalB)
    colliderA.updateTransformMatrix()
    colliderB.updateTransformMatrix()

    return willIntersect
  }

  function narrowPhaseCollisions(collisionPairs: CollisionPair[]) {
    const collisions: Collision[] = []

    // Age existing contacts
    for (const [key, contact] of contactCache.entries()) {
      contact.age++
      if (contact.age > 3) {
        // Remove contacts older than 3 frames
        contactCache.delete(key)
      }
    }

    collisionPairs.forEach((collisionPair: CollisionPair) => {
      // Update collider transforms before collision detection

      collisionPair.colliderA.updateTransformMatrix()
      collisionPair.colliderB.updateTransformMatrix()

      // Create unique key for this collision pair using object references
      const objA = collisionPair.bodyA
      const objB = collisionPair.bodyB
      // const contactKey = objA < objB ? `${objA}:${objB}` : `${objB}:${objA}` // Disabled caching

      // Always generate new contact for now to avoid cached corrupted data
      // TODO: Implement proper cache invalidation when transforms change
      const collisionPoints = collisionPair.colliderA.testCollision(collisionPair.colliderB)
      const manifold: Manifold = pointsToManifold(collisionPoints)

      // Don't cache for now until we fix the cache invalidation
      // if (manifold.hasCollision) {
      //   contactCache.set(contactKey, { manifold, age: 0 })
      // }

      if (manifold.hasCollision) {
        collisions.push(new Collision(collisionPair.bodyA, collisionPair.bodyB, collisionPair.colliderA, collisionPair.colliderB, manifold))
      }
    })

    return collisions
  }

  function resolveCollisions(time: Time, collisions: Collision[]) {
    solvers.forEach((solver) => {
      if (collisions.length === 0) return
      solver.solve(collisions, time)
    })
  }

  function pointsToManifold(points: CollisionPoints): Manifold {
    const manifold = new Manifold(points.normal)
    if (points.hasCollision) {
      manifold.addPoint(points.a, points.b, points.depth)
    }

    return manifold
  }

  return { addObject, removeObject, addSolver, removeSolver, reset, initialize }
})
