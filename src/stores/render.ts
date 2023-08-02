import { onMounted, ref, type Ref } from 'vue'
import { defineStore } from 'pinia'
import { vec3 } from 'gl-matrix'
import { Entity } from '@/models/entity'
import { Scene } from '@/models/scene'

interface Render {
  update: (time: number, renderDelta: number) => void
  lateUpdate: (time: number, renderDelta: number) => void
}

export const useRenderStore = defineStore('render', () => {
  const subscribers: Ref<Render[]> = ref([])
  const isRendering = ref(false)
  const lastRenderTime = ref(0)
  const scene: Ref<Scene> = ref(new Scene())

  onMounted(() => {
    scene.value.camera.position = vec3.fromValues(0, 10, -25)
    scene.value.camera.rotation = vec3.fromValues(-25, 180, 0)
  })

  function subscribeToRender(subscriber: Render) {
    subscribers.value.push(subscriber)
  }

  const traverseTree = (entity: Entity, callback: (entity: Entity) => void) => {
    callback(entity)
    entity.children.forEach((child) => {
      traverseTree(child, callback)
    })
  }

  const startRender = () => {
    isRendering.value = true
  }

  const stopRender = () => {
    isRendering.value = false
  }

  return {
    subscribers,
    isRendering,
    lastRenderTime,
    scene,
    subscribeToRender,
    traverseTree,
    startRender,
    stopRender
  }
})
