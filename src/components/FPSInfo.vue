<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRenderStore } from '@/stores/render'
import { storeToRefs } from 'pinia'
import type { Time } from '@/models/time'

const FPS = ref(0)
const minFPS = ref(1000)
const maxFPS = ref(0)
const frameDelta = ref(0)

const store = useRenderStore()
const { isRendering, hasStarted } = storeToRefs(store)

function reset() {
  FPS.value = 0
  minFPS.value = 1000
  maxFPS.value = 0
  frameDelta.value = 0
}

function update(time: Time) {
  frameDelta.value = Math.round(time.delta * 100) / 100
  FPS.value = Math.round(1000 / frameDelta.value)
  minFPS.value = Math.min(minFPS.value, FPS.value)
  maxFPS.value = Math.max(maxFPS.value, FPS.value)
}

watch(isRendering, () => {
  if (!isRendering.value) {
    reset()
  }
})

watch(hasStarted, () => {
  if (!hasStarted.value) {
    reset()
  } else {
    store.subscribeToRender({ update, lateUpdate: () => {} })
  }
})
</script>

<template>
  <div class="overlay">
    <span>FPS: {{ FPS }}</span>
    <span>Min FPS: {{ minFPS }}</span>
    <span>Max FPS: {{ maxFPS }}</span>
    <span>Frame delta: {{ frameDelta }}ms</span>
  </div>
</template>

<style scoped lang="scss">
.overlay {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  color: var(--success-color);
  padding: 10px;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
}
</style>
