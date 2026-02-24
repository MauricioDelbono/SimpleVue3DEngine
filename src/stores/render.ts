import { ref, type Ref } from 'vue'
import { defineStore } from 'pinia'
import { Entity } from '@/models/entity'
import { Scene } from '@/models/scene'
import { pipelineKeys, useWebGLStore } from './webgl'
import { Time } from '@/models/time'
import { Collider } from '@/physics/collisions/collider'
import Primitives from '@/helpers/primitives'
import { Transform } from '@/models/transform'
import { Frustum } from '@/models/frustum'
import { vec3 } from 'gl-matrix'

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
  const postProcessMesh = Primitives.createXYQuad()
  const postProcessTransform = new Transform()

  const frustum = new Frustum()
  const visibleMap: Map<string, boolean> = new Map()
  const queryMap: Map<string, WebGLQuery> = new Map()
  const unitCube = Primitives.createCube()
  const cubeTransform = new Transform()

  function reset() {
    store.reset()
    subscribers.value = []
    isRendering.value = false
    stepForward.value = 0
    scene.value = new Scene()
    hasStarted.value = false

    visibleMap.clear()
    for (const query of queryMap.values()) {
      store.deleteQuery(query)
    }
    queryMap.clear()
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
    const dofEnabled = scene.value.depthOfField.enabled && !scene.value.wireframe

    // 1. Shadow Pass
    if (!scene.value.wireframe) {
      if (scene.value.directionalLight) {
        const cascadeCount = store.getCascadeCount()
        for (let i = 0; i < cascadeCount; i++) {
          store.prepareShadowCascade(scene.value, i)

          scene.value.entities.forEach((entity) => {
            traverseTree(entity, (entity: Entity) => {
              if (entity.pipeline !== pipelineKeys.light) {
                store.renderMesh(scene.value, pipelineKeys.shadow, entity.mesh, entity.transform, entity.material)
              }
            })
          })
        }
      }
    }

    // 2. Resize
    store.resize()

    // 3. Bind Main Framebuffer or Screen
    if (dofEnabled) {
      store.gl.bindFramebuffer(store.gl.FRAMEBUFFER, store.getMainFrameBuffer())
    } else {
      store.gl.bindFramebuffer(store.gl.FRAMEBUFFER, null)
    }

    // 4. Clear
    store.clearCanvas(scene.value.fog.color)

    // 5. Render Scene
    store.setRenderColor(scene.value)

    // Update Frustum
    frustum.setFromProjectionMatrix(store.getViewProjectionMatrix())

    // Check Queries
    for (const [uuid, query] of queryMap) {
      if (store.isQueryAvailable(query)) {
        const samples = store.getQueryResult(query)
        visibleMap.set(uuid, samples > 0)
      }
    }

    // Collect Renderable Entities
    const visibleEntities: Entity[] = []
    const hiddenEntities: Entity[] = []

    const collect = (entity: Entity) => {
      // Frustum Culling
      if (frustum.intersectsAABB(entity.worldMin, entity.worldMax)) {
        if (visibleMap.get(entity.uuid) !== false) {
          visibleEntities.push(entity)
        } else {
          hiddenEntities.push(entity)
        }
      }
      entity.children.forEach(collect)
    }

    scene.value.entities.forEach(collect)

    // Sort Visible Entities (Front to Back)
    const camPos = scene.value.camera.transform.position
    visibleEntities.sort((a, b) => {
      const distA = vec3.sqrDist(a.transform.worldPosition, camPos)
      const distB = vec3.sqrDist(b.transform.worldPosition, camPos)
      return distA - distB
    })

    // Phase 1: Visible
    visibleEntities.forEach((entity) => {
      let query = queryMap.get(entity.uuid)
      if (!query) {
        query = store.createQuery()
        if (query) queryMap.set(entity.uuid, query)
      }

      if (query) store.gl.beginQuery(store.gl.ANY_SAMPLES_PASSED, query)

      const pipeline = scene.value.wireframe ? pipelineKeys.wireframe : entity.pipeline ?? scene.value.defaultPipeline
      store.renderMesh(scene.value, pipeline, entity.mesh, entity.transform, entity.material)

      if (scene.value.debugColliders) {
        const colliders = entity.getComponents(Collider)
        colliders.forEach((collider) => {
          store.renderMesh(scene.value, pipelineKeys.wireframe, collider.mesh, collider.transform, undefined, { color: [1, 0, 0] })
        })
      }

      if (query) store.gl.endQuery(store.gl.ANY_SAMPLES_PASSED)
    })

    // Phase 2: Hidden (Occlusion Check)
    store.gl.colorMask(false, false, false, false)
    store.gl.depthMask(false)

    hiddenEntities.forEach((entity) => {
      let query = queryMap.get(entity.uuid)
      if (!query) {
        query = store.createQuery()
        if (query) queryMap.set(entity.uuid, query)
      }

      if (query) store.gl.beginQuery(store.gl.ANY_SAMPLES_PASSED, query)

      // Render Unit Cube scaled to AABB
      // Unit cube from Primitives is size 2 centered at origin (min -1, max 1)
      const size = vec3.sub(vec3.create(), entity.worldMax, entity.worldMin)
      const center = vec3.lerp(vec3.create(), entity.worldMin, entity.worldMax, 0.5)

      // Scale = size / 2
      vec3.scale(cubeTransform.scale, size, 0.5)
      vec3.copy(cubeTransform.position, center)
      cubeTransform.updateWorldMatrix()

      store.renderMesh(scene.value, pipelineKeys.occlusion, unitCube, cubeTransform)

      if (query) store.gl.endQuery(store.gl.ANY_SAMPLES_PASSED)
    })

    store.gl.colorMask(true, true, true, true)
    store.gl.depthMask(true)

    // 6. Post Process (if enabled)
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
