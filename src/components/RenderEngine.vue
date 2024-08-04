<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRenderStore } from '../stores/render'
import { usePhysicsStore } from '@/stores/physics'
import { useAssetsStore } from '@/stores/assets'
import Textures from '@/helpers/texture'
import { Material } from '@/models/material'

const props = defineProps({
  autoPlay: {
    type: Boolean,
    required: false,
    default: false
  }
})

const emit = defineEmits(['ready'])

const renderStore = useRenderStore()
const physicsStore = usePhysicsStore()
const assetsStore = useAssetsStore()
const { stepForward, isRendering, hasStarted } = storeToRefs(renderStore)
let renderHandle: number = 0

function initialize() {
  renderStore.initialize()

  const texture = assetsStore.addTexture('default', Textures.createDefaultTexture())
  assetsStore.addMaterial('default', new Material(texture))

  emit('ready', afterInitialize)
}

function afterInitialize() {
  if (props.autoPlay) {
    renderStore.startRender()
  }
}

function render(time: number) {
  renderStore.render(time)
  if (isRendering.value) {
    renderHandle = requestAnimationFrame(render)
  }
}

watch(isRendering, () => {
  if (isRendering.value) {
    renderHandle = requestAnimationFrame(render)
  } else {
    cancelAnimationFrame(renderHandle)
  }
})

watch(stepForward, () => {
  if (stepForward.value > 0) {
    renderHandle = requestAnimationFrame(render)
  } else {
    cancelAnimationFrame(renderHandle)
  }
})

watch(hasStarted, () => {
  if (!hasStarted.value) {
    cancelAnimationFrame(renderHandle)
    assetsStore.reset()
    physicsStore.reset()
    renderStore.reset()
    initialize()
  }
})

onMounted(() => {
  initialize()
})
</script>

<template>
  <div class="render-engine">
    <slot name="left"></slot>
    <slot></slot>
    <canvas id="canvas" tabindex="0"></canvas>
    <slot name="right"></slot>
  </div>
</template>

<style scoped lang="scss">
.render-engine {
  display: grid;
  grid-template-columns: 1fr auto;
  width: inherit;
  overflow: hidden;

  #canvas {
    width: 100%;
    height: 100%;

    &:focus {
      outline: none;
    }
  }
}
</style>
