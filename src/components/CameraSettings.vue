<script setup lang="ts">
import { ref, onMounted, type Ref } from 'vue'
import { useRenderStore } from '@/stores/render'
import { vec3 } from 'gl-matrix'
import { storeToRefs } from 'pinia'
import Input from './Input.vue'

const store = useRenderStore()
const { scene } = storeToRefs(store)
const cameraPosition: Ref<string> = ref('0, 0, 0')
const cameraRotation: Ref<string> = ref('0, 0, 0')

const updateCameraData = (time: number, renderDelta: number) => {
  const position = scene.value.camera.transform.position
  const rotation = scene.value.camera.transform.rotation
  cameraPosition.value = position[0].toFixed(2) + ', ' + position[1].toFixed(2) + ', ' + position[2].toFixed(2)
  cameraRotation.value = rotation[0].toFixed(2) + ', ' + rotation[1].toFixed(2) + ', ' + rotation[2].toFixed(2)
}

function formatVector(vector: vec3) {
  return vector[0].toFixed(2) + ', ' + vector[1].toFixed(2) + ', ' + vector[2].toFixed(2)
}

onMounted(() => {
  setTimeout(() => {
    store.subscribeToRender({ update: () => {}, lateUpdate: updateCameraData })
  }, 500)
})
</script>

<template>
  <div class="overlay">
    <span>Camera Light</span>
    <span>Position: {{ cameraPosition }}</span>
    <span>Rotation: {{ cameraRotation }}</span>

    <div v-if="scene.directionalLight" class="directional">
      <span>Directional Light</span>
      <div style="display: flex; gap: 8px">
        <span>Position:</span>
        <div style="flex: 1"></div>
        <Input v-model="scene.directionalLight.transform.position[0]" type="number" />
        <Input v-model="scene.directionalLight.transform.position[1]" type="number" />
        <Input v-model="scene.directionalLight.transform.position[2]" type="number" />
      </div>

      <div style="display: flex; gap: 8px">
        <span>Rotation:</span>
        <div style="flex: 1"></div>
        <Input v-model="scene.directionalLight.transform.rotation[0]" type="number" />
        <Input v-model="scene.directionalLight.transform.rotation[1]" type="number" />
        <Input v-model="scene.directionalLight.transform.rotation[2]" type="number" />
      </div>

      <div style="display: flex; gap: 8px">
        <span>Scale:</span>
        <div style="flex: 1"></div>
        <Input v-model="scene.directionalLight.transform.scale[0]" type="number" />
        <Input v-model="scene.directionalLight.transform.scale[1]" type="number" />
        <Input v-model="scene.directionalLight.transform.scale[2]" type="number" />
      </div>

      <span>Forward Direction: {{ formatVector(scene.directionalLight.transform.getForwardVector()) }}</span>
      <span>World Forward Direction: {{ formatVector(scene.directionalLight.transform.getForwardVectorWorld()) }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.overlay {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 1;
  color: green;
  font-size: 16px;
  line-height: 20px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;

  .directional {
    margin-top: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .input {
    width: 48px;
  }
}
</style>
