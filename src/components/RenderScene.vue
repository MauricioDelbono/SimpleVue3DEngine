<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRenderStore } from '@/stores/render'
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
const { hasStarted } = storeToRefs(renderStore)
let renderHandle: number = 0

function initialize() {
  renderStore.initialize()
  physicsStore.initialize()

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
  renderStore.setTime(time)
  renderStore.render(renderStore.getTime())
  renderHandle = requestAnimationFrame(render)
}

watch(hasStarted, () => {
  if (!hasStarted.value) {
    cancelAnimationFrame(renderHandle)
    assetsStore.reset()
    physicsStore.reset()
    renderStore.reset()
    initialize()
  } else {
    renderHandle = requestAnimationFrame(render)
  }
})

onMounted(() => {
  initialize()
})
</script>

<template>
  <div class="render-scene">
    <canvas id="canvas" tabindex="0"></canvas>
  </div>
</template>

<style scoped lang="scss">
.render-scene {
  width: 100%;
  height: 100%;
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
