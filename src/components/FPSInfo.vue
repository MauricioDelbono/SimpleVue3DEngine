<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRenderStore } from '@/stores/render'

const FPS = ref(0)
const minFPS = ref(1000)
const maxFPS = ref(0)
const avgFPS = ref(0)
const frameDelta = ref(0)

const store = useRenderStore()

const update = (time: number, renderDelta: number) => {
  frameDelta.value = Math.round(renderDelta * 100) / 100
  FPS.value = Math.round(1000 / frameDelta.value)
  minFPS.value = Math.min(minFPS.value, FPS.value)
  maxFPS.value = Math.max(maxFPS.value, FPS.value)
  // avgFPS.value = Math.round((avgFPS.value + FPS.value) / 2)
}

onMounted(() => {
  setTimeout(() => {
    store.subscribeToRender({ update, lateUpdate: () => {} })
  }, 500)
})
</script>

<template>
  <div class="overlay">
    <span>FPS: {{ FPS }}</span>
    <span>Min FPS: {{ minFPS }}</span>
    <span>Max FPS: {{ maxFPS }}</span>
    <span>Avg FPS: {{ avgFPS }}</span>
    <span>Frame delta: {{ frameDelta }}ms</span>
  </div>
</template>

<style scoped lang="scss">
.overlay {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  color: green;
  font-size: 16px;
  line-height: 20px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
}
</style>
