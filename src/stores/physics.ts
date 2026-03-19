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
import type { Collider } from '@/physics/collisions/collider'

export const usePhysicsStore = defineStore('physics', () => {
  const store = useRenderStore()

  const objects: Rigidbody[] = []
  const solvers: Solver[] = []
  const gravity = vec3.fromValues(0, -9.81, 0)

  // Bolt Optimization: Pre-allocate vectors used in hot physics loops to prevent
  // per-frame garbage collection pauses from repeated vec3.create() calls.
  const tempForce = vec3.create()
  const tempRelVel = vec3.create()
  const tempFutA = vec3.create()
  const tempFutB = vec3.create()
  const tempOrigA = vec3.create()
  const tempOrigB = vec3.create()

  function reset() {
    objects.splice(0, objects.length)
    solvers.splice(0, solvers.length)
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

  // Bolt Optimization: Standard `for` loops replaced high-level `.forEach` and
  // intermediate array allocations (`slice().reverse()`) to minimize GC pressure.
  function applyForces() {
    for (let i = 0; i < objects.length; i++) {
      const object = objects[i]
      if (object.isStatic) continue
      object.applyForce(vec3.scale(tempForce, gravity, object.mass))
    }
  }

  function updateObjects(time: Time) {
    for (let i = 0; i < objects.length; i++) {
      const object = objects[i]
      if (object.isStatic) continue
      object.step(time)
    }
  }

  function broadPhaseCollisions() {
    const colliderPairs: CollisionPair[] = []
    // First iterate over all rigidbodies
    for (let i = objects.length - 1; i >= 0; i--) {
      const object = objects[i]
      if (object.isStatic || object.isSleeping) continue // Skip static and sleeping objects
      const objectColliders = object.colliders

      for (let j = 0; j < objects.length; j++) {
        const otherObject = objects[j]
        // skip self and already checked pairs
        if (object === otherObject || j >= objects.length - (objects.length - 1 - i)) continue
        // Skip if both objects are sleeping (no need to check sleeping vs sleeping)
        if (object.isSleeping && otherObject.isSleeping) continue

        const otherObjectColliders = otherObject.colliders
        if (!objectColliders.length || !otherObjectColliders.length) continue

        // Then iterate over all colliders of each of the rigidbodies
        for (let k = 0; k < objectColliders.length; k++) {
          const collider = objectColliders[k]
          for (let l = 0; l < otherObjectColliders.length; l++) {
            const otherCollider = otherObjectColliders[l]
            // Check for potential tunneling with fast-moving objects
            const isFastMoving = vec3.length(object.velocity) > 10 || vec3.length(otherObject.velocity) > 10

            if (collider.intersects(otherCollider) || (isFastMoving && sweptIntersection(object, otherObject, collider, otherCollider))) {
              colliderPairs.push(new CollisionPair(object, otherObject, collider, otherCollider))
            }
          }
        }
      }
    }

    return colliderPairs
  }

  function sweptIntersection(bodyA: Rigidbody, bodyB: Rigidbody, colliderA: Collider, colliderB: Collider): boolean {
    // Simple swept intersection check using velocity projection
    const relativeVelocity = vec3.subtract(tempRelVel, bodyA.velocity, bodyB.velocity)
    const relativeSpeed = vec3.length(relativeVelocity)

    if (relativeSpeed < 1e-6) return false // Objects not moving relative to each other

    // Project positions forward by a fraction of the time step
    const timeStep = 1 / 60 // Assume 60 FPS
    const sweepTime = timeStep * 0.5 // Look ahead half a frame

    // Calculate future positions
    const futureA = vec3.scaleAndAdd(tempFutA, bodyA.position, bodyA.velocity, sweepTime)
    const futureB = vec3.scaleAndAdd(tempFutB, bodyB.position, bodyB.velocity, sweepTime)

    // Check if colliders would intersect at future positions
    const originalA = vec3.copy(tempOrigA, bodyA.position)
    const originalB = vec3.copy(tempOrigB, bodyB.position)

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

    for (let i = 0; i < collisionPairs.length; i++) {
      const collisionPair = collisionPairs[i]
      // Update collider transforms before collision detection

      collisionPair.colliderA.updateTransformMatrix()
      collisionPair.colliderB.updateTransformMatrix()

      const manifold = collisionPair.colliderA.testCollisionManifold(collisionPair.colliderB)

      if (manifold.hasCollision) {
        collisions.push(new Collision(collisionPair.bodyA, collisionPair.bodyB, collisionPair.colliderA, collisionPair.colliderB, manifold))
      }
    }

    return collisions
  }

  function resolveCollisions(time: Time, collisions: Collision[]) {
    if (collisions.length === 0) return
    for (let i = 0; i < solvers.length; i++) {
      solvers[i].solve(collisions, time)
    }
  }

  return { addObject, removeObject, addSolver, removeSolver, reset, initialize }
})
