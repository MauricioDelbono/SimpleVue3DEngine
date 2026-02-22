<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRenderStore } from '@/stores/render'
import { usePhysicsStore } from '@/stores/physics'
import { useAssetsStore } from '@/stores/assets'
import Textures from '@/helpers/texture'
import { Material } from '@/models/material'
import SceneInspector from './sceneInspector/SceneInspector.vue'
import SceneControls from './SceneControls.vue'
import FPSInfo from './FPSInfo.vue'
import { useInputStore } from '@/stores/input'
import { useCamera } from '@/composables/camera'
import { Camera } from '@/models/camera'

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
const inputStore = useInputStore()
const camera = useCamera()
const { hasStarted } = storeToRefs(renderStore)
let renderHandle: number = 0
const canvasRef = ref<HTMLCanvasElement | null>(null)

function initialize() {
  if (canvasRef.value) {
    renderStore.initialize(canvasRef.value)
  }
  physicsStore.initialize()
  inputStore.initialize()
  camera.initialize()
  renderStore.scene.camera = new Camera()

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
  camera.update(renderStore.getTime())
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
  renderStore.reset()
  physicsStore.reset()
  assetsStore.reset()
  initialize()
})

onUnmounted(() => {
  cancelAnimationFrame(renderHandle)
})
</script>

<template>
  <div class="render-engine">
    <FPSInfo />
    <SceneControls />
    <canvas ref="canvasRef" class="render-canvas" tabindex="0"></canvas>
    <SceneInspector />
  </div>
</template>

<style scoped lang="scss">
.render-engine {
  display: grid;
  grid-template-columns: 1fr auto;
  width: inherit;
  height: inherit;
  overflow: hidden;

  .render-canvas {
    width: 100%;
    height: 100%;

    &:focus {
      outline: none;
    }
  }
}
</style>
