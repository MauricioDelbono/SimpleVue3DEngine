<script setup lang="ts">
import { onMounted } from 'vue'
import { useWebGLStore } from '../stores/webgl'
import { storeToRefs } from 'pinia'
import { useRenderStore } from '../stores/render'
import { Entity } from '../models/entity'

const emit = defineEmits(['ready'])

const store = useWebGLStore()
const renderStore = useRenderStore()
const { subscribers, scene, lastRenderTime } = storeToRefs(renderStore)

const initialize = () => {
  store.initialize('canvas')
  store.setFieldOfView(60)

  emit('ready')
}

const render = (time: number) => {
  const renderDelta = time - lastRenderTime.value
  lastRenderTime.value = time

  // Update
  scene.value.entities.forEach((entity) => {
    renderStore.traverseTree(entity, (entity: Entity) => {
      entity.update(time, renderDelta)
    })
  })

  subscribers.value.forEach((subscriber) => {
    subscriber.update(time, renderDelta)
  })

  store.resize()
  store.clearCanvas(scene.value.fogColor)
  store.setGlobalUniforms(scene.value)
  scene.value.updateWorldMatrix()

  // Render
  scene.value.entities.forEach((entity) => {
    renderStore.traverseTree(entity, (entity: Entity) => {
      store.renderEntity(scene.value, entity)
    })
  })

  // Late update
  scene.value.entities.forEach((entity) => {
    renderStore.traverseTree(entity, (entity: Entity) => {
      entity.lateUpdate(time, renderDelta)
    })
  })
  subscribers.value.forEach((subscriber) => {
    subscriber.lateUpdate(time, renderDelta)
  })

  requestAnimationFrame(render)
}

onMounted(() => {
  initialize()
  requestAnimationFrame(render)
})
</script>

<template>
  <slot></slot>
  <canvas id="canvas" tabindex="0"></canvas>
</template>

<style scoped lang="scss">
#canvas {
  width: 100%;
  height: 100%;

  &:focus {
    outline: none;
  }
}
</style>
