<script setup lang="ts">
import { useRenderStore } from '@/stores/render'
import { storeToRefs } from 'pinia'

const store = useRenderStore()
const { isRendering } = storeToRefs(store)
</script>

<template>
  <div class="overlay">
    <button :disabled="isRendering" @click="store.startRender()">Start</button>
    <button :disabled="!isRendering" @click="store.stopRender()">Stop</button>
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

  button {
    background: #2d2d2d;
    border: 1px solid gray;
    border-radius: 4px;
    padding: 4px 10px;
    color: white;

    &:disabled {
      opacity: 0.5;
    }

    &:hover {
      cursor: pointer;
      transform: scale(1.05);
    }

    &:active {
      transform: scale(0.95);
    }
  }
}
</style>
