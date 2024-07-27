<script setup lang="ts">
import { useRenderStore } from '@/stores/render'
import { storeToRefs } from 'pinia'
import VButton from './shared/VButton/VButton.vue'
import VIcon from './shared/VIcon/VIcon.vue'

const store = useRenderStore()
const { isRendering } = storeToRefs(store)
</script>

<template>
  <div class="overlay">
    <VIcon name="play" />
    <VIcon name="pause" />
    <VIcon name="stop" />
    <VIcon name="step-forward" />
    <VButton v-if="!isRendering" @click="store.startRender()">Play</VButton>
    <VButton v-else @click="store.pauseRender()">Pause</VButton>
    <VButton :disabled="!isRendering" @click="store.stopRender()">Stop</VButton>
    <VButton :disabled="isRendering" @click="store.stepRender()">Step</VButton>
  </div>
</template>

<style scoped lang="scss">
.overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1;

  display: flex;
  flex-direction: row;
  width: fit-content;
  background: none;
  gap: 8px;
  margin: 0 auto;
  padding: 10px;
}
</style>
