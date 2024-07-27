import { ref, type Ref } from 'vue'
import { defineStore } from 'pinia'
import { Entity } from '@/models/entity'
import { Scene } from '@/models/scene'
import { useWebGLStore } from './webgl'

interface Render {
  update: (time: number, renderDelta: number) => void
  lateUpdate: (time: number, renderDelta: number) => void
}

export const useRenderStore = defineStore('render', () => {
  const subscribers: Ref<Render[]> = ref([])
  const isRendering = ref(false)
  const lastRenderTime = ref(0)
  const scene: Ref<Scene> = ref(new Scene())
  const store = useWebGLStore()

  const initialize = () => {
    store.initialize('canvas')
    store.setFieldOfView(60)
  }

  function subscribeToRender(subscriber: Render) {
    subscribers.value.push(subscriber)
  }

  const traverseTree = (entity: Entity, callback: (entity: Entity) => void) => {
    callback(entity)
    entity.children.forEach((child) => {
      traverseTree(child, callback)
    })
  }

  const renderScene = () => {
    scene.value.updateWorldMatrix()

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

  const startRender = () => {
    isRendering.value = true
  }

  const pauseRender = () => {
    isRendering.value = true
  }

  const stopRender = () => {
    isRendering.value = false
  }

  const stepRender = () => {}

  return {
    subscribers,
    isRendering,
    lastRenderTime,
    scene,
    initialize,
    subscribeToRender,
    traverseTree,
    startRender,
    pauseRender,
    stopRender,
    stepRender,
    renderScene
  }
})
