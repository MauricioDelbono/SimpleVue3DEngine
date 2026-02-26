<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRenderStore } from '@/stores/render'
import { useWebGLStore } from '@/stores/webgl'
import { storeToRefs } from 'pinia'
import type { Entity } from '@/models/entity'
import VTree from '../shared/VTree/VTree.vue'
import VButton from '../shared/VButton/VButton.vue'
import { GLTFLoader } from '@/loaders/gltf'

const emits = defineEmits(['entitySelected'])

const store = useRenderStore()
const webglStore = useWebGLStore()
const { scene } = storeToRefs(store)
const fileInput = ref<HTMLInputElement | null>(null)

function event_entitySelected(entity: Entity) {
  emits('entitySelected', entity)
}

function triggerFileInput() {
  fileInput.value?.click()
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    const file = input.files[0]
    const arrayBuffer = await file.arrayBuffer()
    const loader = new GLTFLoader()
    try {
      const entity = await loader.parse(webglStore.gl, arrayBuffer)
      scene.value.entities.push(entity)
    } catch (error) {
      console.error('Failed to load GLB:', error)
    }
  }
}

onMounted(() => {})
</script>

<template>
  <div class="scene-hierarchy">
    <div class="header">
      <span>Scene</span>
      <VButton icon-left="file-import" @click="triggerFileInput" />
    </div>
    <input type="file" ref="fileInput" accept=".glb" @change="handleFileChange" style="display: none" />
    <VTree v-slot="{ item }" v-if="scene?.entities" :items="scene.entities" @itemSelected="event_entitySelected">
      {{ item.name }}
    </VTree>
  </div>
</template>

<style scoped lang="scss">
.scene-hierarchy {
  display: flex;
  flex-direction: column;
  padding: 16px;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }
}
</style>
