import { defineStore, storeToRefs } from 'pinia'
import { useRenderStore } from './render'
import { onMounted } from 'vue'
import { vec3 } from 'gl-matrix'
import type { Solver } from '@/physics/dynamics/solver'
import { Collision } from '@/physics/collisions/collision'
import type { Rigidbody } from '@/physics/dynamics/rigidBody'
import { PositionSolver } from '@/physics/dynamics/positionSolver'

export const usePhysicsStore = defineStore('physics', () => {
  const store = useRenderStore()

  const objects: Rigidbody[] = []
  const solvers: Solver[] = []
  const gravity = vec3.fromValues(0, -9.81, 0)

  onMounted(() => {
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
    applyForces()
    resolveCollisions(delta)
    moveObjects(delta)
  }

  const applyForces = () => {
    objects.forEach((object) => {
      if (object.isStatic) return
      object.applyForce(vec3.scale([0, 0, 0], gravity, object.mass))
    })
  }

  const moveObjects = (delta: number) => {
    objects.forEach((object) => {
      if (object.isStatic) return
      object.move(delta)
    })
  }

  const resolveCollisions = (delta: number) => {
    const collisions: Collision[] = []
    // First iterate over all rigidbodies
    objects.forEach((object) => {
      const objectColliders = object.colliders
      objects.forEach((otherObject) => {
        if (object === otherObject) return
        const otherObjectColliders = otherObject.colliders
        if (!objectColliders.length || !otherObjectColliders.length) return

        // Then iterate over all colliders of each of the rigidbodies
        objectColliders.forEach((collider) => {
          otherObjectColliders.forEach((otherCollider) => {
            const collisionPoints = collider.testCollision(otherCollider)
            if (collisionPoints.hasCollision) {
              collisions.push(new Collision(object, otherObject, collisionPoints))
            }
          })
        })
      })
    })

    solvers.forEach((solver) => {
      if (collisions.length === 0) return
      solver.solve(collisions, delta)
    })
  }

  return { addObject, removeObject, addSolver, removeSolver }
})
