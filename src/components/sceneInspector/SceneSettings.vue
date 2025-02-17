<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRenderStore } from '@/stores/render'
import { storeToRefs } from 'pinia'
import VCheckbox from '../shared/VCheckbox/VCheckbox.vue'

const store = useRenderStore()
const { scene } = storeToRefs(store)

onMounted(() => {})
</script>

<template>
  <div class="scene-settings">
    <h3>Settings</h3>

    <div class="scene-settings-prop">
      <span>Wireframe Mode:</span>
      <div style="flex: 1"></div>
      <VCheckbox v-model="scene.wireframe" />
    </div>

    <div class="scene-settings-prop">
      <span>Show Colliders:</span>
      <div style="flex: 1"></div>
      <VCheckbox v-model="scene.debugColliders" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.scene-settings {
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 8px;

  &-prop {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}
</style>
