<script setup lang="ts">
import { useRenderStore } from '@/stores/render'
import { storeToRefs } from 'pinia'
import VButton from './shared/VButton/VButton.vue'

const store = useRenderStore()
const { isRendering } = storeToRefs(store)
</script>

<template>
  <div class="overlay">
    <VButton v-if="!isRendering" icon icon-left="play" @click="store.startRender()">Play</VButton>
    <VButton v-else icon icon-left="pause" @click="store.pauseRender()">Pause</VButton>
    <VButton icon icon-left="stop" :disabled="!isRendering" @click="store.stopRender()">Stop</VButton>
    <VButton icon icon-left="step-forward" :disabled="isRendering" @click="store.stepRender()">Step</VButton>
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
