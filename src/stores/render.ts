import { ref, type Ref } from 'vue'
import { defineStore } from 'pinia'
import { Entity } from '@/models/entity'
import { Scene } from '@/models/scene'
import { useWebGLStore } from './webgl'
import { Time } from '@/models/time'

interface Render {
  update: (time: Time) => void
  lateUpdate: (time: Time) => void
}

export const useRenderStore = defineStore('render', () => {
  const subscribers: Ref<Render[]> = ref([])
  const hasStarted = ref(false)
  const isRendering = ref(false)
  const stepForward = ref(0)
  const stepSize = ref(10)
  const lastRenderTime: Ref<Time> = ref(new Time(0))
  const scene: Ref<Scene> = ref(new Scene())
  const store = useWebGLStore()

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
    // Update
    if (isRendering.value) {
      scene.value.entities.forEach((entity) => {
        traverseTree(entity, (entity: Entity) => {
          entity.update(time)
        })
      })

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

    store.clearCanvas(scene.value.fog.color)
    store.setRenderShadowMap(scene.value)

    scene.value.entities.forEach((entity) => {
      traverseTree(entity, (entity: Entity) => {
        store.renderEntity(scene.value, entity)
      })
    })

    store.resize()
    store.setRenderColor(scene.value)

    scene.value.entities.forEach((entity) => {
      traverseTree(entity, (entity: Entity) => {
        store.renderEntity(scene.value, entity)
      })
    })

    // store.renderShadowMapTexture(scene.value)
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
