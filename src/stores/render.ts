import { ref, type Ref } from 'vue'
import { defineStore } from 'pinia'
import { Entity } from '@/models/entity'
import { Scene } from '@/models/scene'
import { pipelineKeys, useWebGLStore } from './webgl'
import { Time } from '@/models/time'
import { Collider } from '@/physics/collisions/collider'
import Primitives from '@/helpers/primitives'
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

  const quadMesh = Primitives.createXYQuad(2.0, 0.0, 0.0)
  const quadTransform = new Transform()
  const postProcessMesh = Primitives.createXYQuad()
  const postProcessTransform = new Transform()

  function reset() {
    store.reset()
    subscribers.value = []
    isRendering.value = false
    stepForward.value = 0
    scene.value = new Scene()
    hasStarted.value = false
  }

  function initialize(canvas: HTMLCanvasElement | string = 'canvas') {
    store.initialize(canvas)
    store.setFieldOfView(60)
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
    store.updateCameraMatrices(scene.value)
    const dofEnabled = scene.value.depthOfField && scene.value.depthOfField.enabled && !scene.value.wireframe

    // Shadow Pass
    if (!scene.value.wireframe && scene.value.directionalLight) {
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

    store.resize()

    // Geometry Pass
    store.gl.bindFramebuffer(store.gl.FRAMEBUFFER, store.getGBuffer())
    store.gl.clearColor(0, 0, 0, 0)
    store.gl.clear(store.gl.COLOR_BUFFER_BIT | store.gl.DEPTH_BUFFER_BIT)

    // Wireframe Override
    if (scene.value.wireframe) {
       store.gl.bindFramebuffer(store.gl.FRAMEBUFFER, null)
       store.gl.clearColor(scene.value.fog.color[0], scene.value.fog.color[1], scene.value.fog.color[2], scene.value.fog.color[3])
       store.gl.clear(store.gl.COLOR_BUFFER_BIT | store.gl.DEPTH_BUFFER_BIT)

       scene.value.entities.forEach((entity) => {
         traverseTree(entity, (entity: Entity) => {
           store.renderMesh(scene.value, pipelineKeys.wireframe, entity.mesh, entity.transform, entity.material)
         })
       })
       return
    }

    scene.value.entities.forEach((entity) => {
      traverseTree(entity, (entity: Entity) => {
        const pipeline = entity.pipeline === pipelineKeys.default ? pipelineKeys.geometry : (entity.pipeline ?? pipelineKeys.geometry)

        if (pipeline === pipelineKeys.light || pipeline === pipelineKeys.skybox || pipeline === pipelineKeys.wireframe) return

        store.renderMesh(scene.value, pipeline, entity.mesh, entity.transform, entity.material)
      })
    })

    // SSAO Pass
    store.gl.bindFramebuffer(store.gl.FRAMEBUFFER, store.getSSAOBuffer())
    store.gl.clear(store.gl.COLOR_BUFFER_BIT)
    store.pipelines[pipelineKeys.ssao].setGlobalUniforms(scene.value)
    store.renderMesh(scene.value, pipelineKeys.ssao, quadMesh, quadTransform)

    // SSAO Blur Pass
    store.gl.bindFramebuffer(store.gl.FRAMEBUFFER, store.getSSAOBlurBuffer())
    store.gl.clear(store.gl.COLOR_BUFFER_BIT)
    store.pipelines[pipelineKeys.ssaoBlur].setGlobalUniforms(scene.value)
    store.renderMesh(scene.value, pipelineKeys.ssaoBlur, quadMesh, quadTransform)

    // Lighting Pass
    // If DoF is enabled, render to MainFrameBuffer, else render to screen
    if (dofEnabled) {
      store.gl.bindFramebuffer(store.gl.FRAMEBUFFER, store.getMainFrameBuffer())
    } else {
      store.gl.bindFramebuffer(store.gl.FRAMEBUFFER, null)
    }

    store.gl.clearColor(scene.value.fog.color[0], scene.value.fog.color[1], scene.value.fog.color[2], scene.value.fog.color[3])
    store.gl.clear(store.gl.COLOR_BUFFER_BIT | store.gl.DEPTH_BUFFER_BIT)

    store.pipelines[pipelineKeys.lighting].setGlobalUniforms(scene.value)
    store.renderMesh(scene.value, pipelineKeys.lighting, quadMesh, quadTransform)

    // Copy Depth & Forward Pass
    if (dofEnabled) {
      store.copyDepthBufferToMain()
    } else {
      store.copyDepthBufferToDefault()
    }

    store.renderSkybox(scene.value)

    // Debug / Light Helpers / Forward Entities
    scene.value.entities.forEach((entity) => {
      traverseTree(entity, (entity: Entity) => {
        if (entity.pipeline === pipelineKeys.light) {
            store.renderMesh(scene.value, pipelineKeys.light, entity.mesh, entity.transform, entity.material)
        }
        if (scene.value.debugColliders) {
          const colliders = entity.getComponents(Collider)
          colliders.forEach((collider) => {
            store.renderMesh(scene.value, pipelineKeys.wireframe, collider.mesh, collider.transform, undefined, { color: [1, 0, 0] })
          })
        }
      })
    })

    // Post Process (DoF)
    if (dofEnabled) {
      store.gl.bindFramebuffer(store.gl.FRAMEBUFFER, null)
      store.gl.clear(store.gl.COLOR_BUFFER_BIT | store.gl.DEPTH_BUFFER_BIT)
      store.renderMesh(scene.value, pipelineKeys.postProcess, postProcessMesh, postProcessTransform, undefined)
    }
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
