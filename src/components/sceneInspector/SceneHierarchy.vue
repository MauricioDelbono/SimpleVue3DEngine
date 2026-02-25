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

function importGLB() {
  fileInput.value?.click()
}

async function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const file = target.files[0]
    const url = URL.createObjectURL(file)
    const loader = new GLTFLoader()

    try {
      const entity = await loader.load(webglStore.gl, url)
      scene.value.entities.push(entity)
    } catch (error) {
      console.error('Error loading GLB:', error)
      alert('Failed to load GLB file.')
    } finally {
      URL.revokeObjectURL(url)
      target.value = ''
    }
  }
}

onMounted(() => {})
</script>

<template>
  <div class="scene-hierarchy">
    <div class="header">
      <span>Scene</span>
      <VButton @click="importGLB">Import GLB</VButton>
      <input type="file" ref="fileInput" @change="onFileChange" accept=".glb" style="display: none" />
    </div>
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
    margin-bottom: 12px;
    font-weight: bold;
  }
}
</style>
