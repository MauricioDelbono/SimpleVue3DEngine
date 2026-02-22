import { ref, type Ref } from 'vue'
import { defineStore } from 'pinia'
import { Entity } from '@/models/entity'
import { Scene } from '@/models/scene'
import { pipelineKeys, useWebGLStore } from './webgl'
import { Time } from '@/models/time'
import { Collider } from '@/physics/collisions/collider'
import Primitives from '@/helpers/primitives'
import { Mesh } from '@/models/mesh'
import { Transform } from '@/models/transform'

interface Render {
  update: (time: Time) => void
  lateUpdate: (time: Time) => void
}

export const useRenderStore = defineStore('render', () => {
  const subscribers: Ref<Render[]> = ref([])
  const hasStarted = ref(false)
  const isRendering = ref(false)
  const stepForward = ref(0)
  const lastRenderTime: Ref<Time> = ref(new Time(0))
  const scene: Ref<Scene> = ref(new Scene())
  const store = useWebGLStore()

  let quadMesh: Mesh = null
  const quadTransform = new Transform()

  function reset() {
    store.reset()
    subscribers.value = []
    isRendering.value = false
    stepForward.value = 0
    scene.value = new Scene()
    hasStarted.value = false
  }

  function initialize() {
    store.initialize('canvas')
    store.setFieldOfView(60)
    quadMesh = Primitives.createXYQuad()
  }

  function subscribeToRender(subscriber: Render) {
    subscribers.value.push(subscriber)
  }

  function traverseTree(entity: Entity, callback: (entity: Entity) => void) {
    callback(entity)
    entity.children.forEach((child) => {
      traverseTree(child, callback)
    })
  }

  function getTime() {
    return lastRenderTime.value
  }

  function setTime(timestamp: number) {
    const time = new Time(timestamp, lastRenderTime.value)
    lastRenderTime.value = time
  }

  function render(time: Time) {
    // Update transform matrices first (for initial setup)
    scene.value.updateTransformMatrices()

    // Update
    if (isRendering.value) {
      // First update entities (including rigidbody physics)
      scene.value.entities.forEach((entity) => {
        traverseTree(entity, (entity: Entity) => {
          entity.update(time)
        })
      })

      // Update transform matrices again after physics to ensure colliders have latest positions
      scene.value.updateTransformMatrices()

      // Then run physics collision detection and response
      subscribers.value.forEach((subscriber) => {
        subscriber.update(time)
      })
    }

    // Render
    renderScene()

    // Late update
    if (isRendering.value) {
      scene.value.entities.forEach((entity) => {
        traverseTree(entity, (entity: Entity) => {
          entity.lateUpdate(time)
        })
      })

      subscribers.value.forEach((subscriber) => {
        subscriber.lateUpdate(time)
      })
    }

    if (stepForward.value > 0) {
      stepForward.value--

      if (stepForward.value === 0) {
        isRendering.value = false
      }
    }
  }

  function renderScene() {
    scene.value.updateTransformMatrices()

    // 1. Shadow Pass
    if (!scene.value.wireframe) {
      if (scene.value.directionalLight) {
        const cascadeCount = store.getCascadeCount()
        for (let i = 0; i < cascadeCount; i++) {
          store.prepareShadowCascade(scene.value, i)

          scene.value.entities.forEach((entity) => {
            traverseTree(entity, (entity: Entity) => {
              if (entity.pipeline !== pipelineKeys.light && entity.pipeline !== pipelineKeys.skybox) {
                store.renderMesh(scene.value, pipelineKeys.shadow, entity.mesh, entity.transform, entity.material)
              }
            })
          })
        }
      }
    }

    store.resize()

    // 2. G-Buffer Pass
    // Clear handled by setGlobalUniforms
    if (!scene.value.wireframe) {
        store.pipelines[pipelineKeys.gbuffer].setGlobalUniforms(scene.value)
        scene.value.entities.forEach((entity) => {
          traverseTree(entity, (entity: Entity) => {
            if (entity.pipeline === pipelineKeys.light) return
            if (entity.pipeline === pipelineKeys.skybox) return

            store.renderMesh(scene.value, pipelineKeys.gbuffer, entity.mesh, entity.transform, entity.material)
          })
        })
    }

    // 3. Deferred Lighting Pass
    if (!scene.value.wireframe) {
        // Bind default framebuffer (implicitly done by setGlobalUniforms if it unbinds G-Buffer)
        store.pipelines[pipelineKeys.deferred].setGlobalUniforms(scene.value)
        store.renderMesh(scene.value, pipelineKeys.deferred, quadMesh, quadTransform)
    } else {
        store.clearCanvas(scene.value.fog.color)
    }

    // 4. Forward Pass (Skybox, Debug, Wireframes)
    // Restore depth buffer from G-Buffer so forward pass respects geometry
    if (!scene.value.wireframe) {
        store.copyDepthBuffer()
    }

    // Set up forward rendering state (Skybox is rendered here)
    store.setRenderColor(scene.value)

    // Render wireframes / debug / lights
    scene.value.entities.forEach((entity) => {
      traverseTree(entity, (entity: Entity) => {
        // If wireframe mode globally enabled, render everything as wireframe
        if (scene.value.wireframe) {
           store.renderMesh(scene.value, pipelineKeys.wireframe, entity.mesh, entity.transform, entity.material)
        } else {
           // Otherwise, only render things that weren't in G-Buffer (Lights) or debug stuff
           if (entity.pipeline === pipelineKeys.light) {
               store.renderMesh(scene.value, pipelineKeys.light, entity.mesh, entity.transform, entity.material)
           }
        }

        if (scene.value.debugColliders) {
          const colliders = entity.getComponents(Collider)
          colliders.forEach((collider) => {
            store.renderMesh(scene.value, pipelineKeys.wireframe, collider.mesh, collider.transform, undefined, { color: [1, 0, 0] })
          })
        }
      })
    })
  }

  function startRender() {
    lastRenderTime.value = new Time(performance.now())
    hasStarted.value = true
    isRendering.value = true
  }

  function pauseRender() {
    isRendering.value = false
  }

  function stopRender() {
    hasStarted.value = false
  }

  function stepRender() {
    isRendering.value = true
    stepForward.value = 1
  }

  return {
    stepForward,
    isRendering,
    hasStarted,
    scene,
    initialize,
    subscribeToRender,
    startRender,
    pauseRender,
    stopRender,
    stepRender,
    getTime,
    setTime,
    render,
    reset
  }
})
