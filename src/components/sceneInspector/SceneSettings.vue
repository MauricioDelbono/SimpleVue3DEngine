<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRenderStore } from '@/stores/render'
import { storeToRefs } from 'pinia'
import VCheckbox from '../shared/VCheckbox/VCheckbox.vue'
import VInput from '../shared/VInput/VInput.vue'

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

    <h3 style="margin-top: 16px">Depth of Field</h3>

    <div class="scene-settings-prop">
      <span>Enable:</span>
      <div style="flex: 1"></div>
      <VCheckbox v-model="scene.depthOfField.enabled" />
    </div>

    <div class="scene-settings-prop" v-if="scene.depthOfField.enabled">
      <span>Focus Distance:</span>
      <div style="flex: 1"></div>
      <VInput v-model="scene.depthOfField.focusDistance" type="number" style="width: 60px" />
    </div>

    <div class="scene-settings-prop" v-if="scene.depthOfField.enabled">
      <span>Focus Range:</span>
      <div style="flex: 1"></div>
      <VInput v-model="scene.depthOfField.focusRange" type="number" style="width: 60px" />
    </div>

    <div class="scene-settings-prop" v-if="scene.depthOfField.enabled">
      <span>Bokeh Radius:</span>
      <div style="flex: 1"></div>
      <VInput v-model="scene.depthOfField.bokehRadius" type="number" style="width: 60px" />
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
