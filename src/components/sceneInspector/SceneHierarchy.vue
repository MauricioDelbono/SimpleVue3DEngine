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

function importModel() {
  fileInput.value?.click()
}

async function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const file = target.files[0]
    const url = URL.createObjectURL(file)
    const loader = new GLTFLoader()
    const entity = await loader.load(webglStore.gl, url)
    scene.value.entities.push(entity)
    URL.revokeObjectURL(url)
    target.value = ''
  }
}

onMounted(() => {})
</script>

<template>
  <div class="scene-hierarchy">
    <div class="header">
      <span>Scene</span>
      <VButton icon-left="FileImport" @click="importModel" />
      <input ref="fileInput" type="file" accept=".glb" style="display: none" @change="onFileChange" />
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
    margin-bottom: 8px;

    span {
      font-weight: bold;
    }
  }
}
</style>
