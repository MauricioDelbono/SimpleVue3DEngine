import { defineStore, storeToRefs } from 'pinia'
import { useRenderStore } from './render'
import { onMounted } from 'vue'
import { vec3 } from 'gl-matrix'
import type { Solver } from '@/physics/dynamics/solver'
import { Collision } from '@/physics/collisions/collision'
import type { Rigidbody } from '@/physics/dynamics/rigidBody'
import { PositionSolver } from '@/physics/dynamics/positionSolver'
import { ImpulseSolver } from '@/physics/dynamics/impulseSolver'
import type { Collider } from '@/physics/collisions/collider'
import { CollisionPair } from '@/physics/collisions/collisionPair'

export const usePhysicsStore = defineStore('physics', () => {
  const store = useRenderStore()

  const objects: Rigidbody[] = []
  const solvers: Solver[] = []
  const gravity = vec3.fromValues(0, -9.81, 0)

  onMounted(() => {
    addSolver(new ImpulseSolver())
    addSolver(new PositionSolver())
    store.subscribeToRender({ update: step, lateUpdate: () => {} })
  })

  const addObject = (object: Rigidbody) => {
    objects.push(object)
  }

  const removeObject = (object: Rigidbody) => {
    const index = objects.indexOf(object)
    if (index > -1) {
      objects.splice(index, 1)
    }
  }

  const addSolver = (solver: Solver) => {
    solvers.push(solver)
  }

  const removeSolver = (solver: Solver) => {
    const index = solvers.indexOf(solver)
    if (index > -1) {
      solvers.splice(index, 1)
    }
  }

  const step = (time: number, delta: number) => {
    // Dynamics
    applyForces()
    moveObjects(delta)

    // Collisions
    const collisionPairs = broadPhaseCollisions()
    const collisions = narrowPhaseCollisions(collisionPairs)
    resolveCollisions(delta, collisions)
  }

  const applyForces = () => {
    objects.forEach((object) => {
      if (object.isStatic) return
      object.applyForce(gravity)
    })
  }

  const moveObjects = (delta: number) => {
    objects.forEach((object) => {
      if (object.isStatic) return
      object.move(delta)
    })
  }

  const broadPhaseCollisions = () => {
    const colliderPairs: CollisionPair[] = []
    // First iterate over all rigidbodies
    objects.reverse().forEach((object, i) => {
      if (object.isStatic) return
      const objectColliders = object.colliders
      objects.forEach((otherObject, j) => {
        // skip self and already checked pairs
        if (object === otherObject || j >= objects.length - i) return
        const otherObjectColliders = otherObject.colliders
        if (!objectColliders.length || !otherObjectColliders.length) return

        // Then iterate over all colliders of each of the rigidbodies
        objectColliders.forEach((collider) => {
          otherObjectColliders.forEach((otherCollider) => {
            if (collider.isWithinBounds(otherCollider)) {
              colliderPairs.push(new CollisionPair(object, otherObject, collider, otherCollider))
            }
          })
        })
      })
    })

    return colliderPairs
  }

  const narrowPhaseCollisions = (collisionPairs: CollisionPair[]) => {
    const collisions: Collision[] = []
    collisionPairs.forEach((collisionPair: CollisionPair) => {
      const collisionPoints = collisionPair.colliderA.testCollision(collisionPair.colliderB)
      if (collisionPoints.hasCollision) {
        collisions.push(new Collision(collisionPair.entityA, collisionPair.entityB, collisionPoints))
      }
    })

    return collisions
  }

  const resolveCollisions = (delta: number, collisions: Collision[]) => {
    solvers.forEach((solver) => {
      if (collisions.length === 0) return
      solver.solve(collisions, delta)
    })
  }

  return { addObject, removeObject, addSolver, removeSolver }
})
