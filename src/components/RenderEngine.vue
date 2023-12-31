<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useWebGLStore } from '../stores/webgl'
import { storeToRefs } from 'pinia'
import { useRenderStore } from '../stores/render'
import { Entity } from '../models/entity'
import { usePhysicsStore } from '@/stores/physics'
import { useAssetsStore } from '@/stores/assets'
import Textures from '@/helpers/texture'
import { Material } from '@/models/material'

const emit = defineEmits(['ready'])

const store = useWebGLStore()
const renderStore = useRenderStore()
const physicsStore = usePhysicsStore()
const assetsStore = useAssetsStore()
const { subscribers, scene, lastRenderTime, isRendering } = storeToRefs(renderStore)
let renderHandle: number = 0

const initialize = () => {
  store.initialize('canvas')
  store.setFieldOfView(60)

  const texture = assetsStore.addTexture('default', Textures.createDefaultTexture())
  assetsStore.addMaterial('default', new Material(texture))

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
  store.clearCanvas(scene.value.fog.color)
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

  renderHandle = requestAnimationFrame(render)
}

watch(isRendering, () => {
  if (isRendering.value) {
    renderHandle = requestAnimationFrame(render)
  } else {
    cancelAnimationFrame(renderHandle)
  }
})

onMounted(() => {
  initialize()
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
