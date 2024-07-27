<script setup lang="ts">
import { onMounted } from 'vue'
import { useRenderStore } from '@/stores/render'
import { storeToRefs } from 'pinia'
import type { Entity } from '@/models/entity'
import VTree from '../shared/VTree/VTree.vue'

const emits = defineEmits(['entitySelected'])

const store = useRenderStore()
const { scene } = storeToRefs(store)

function event_entitySelected(entity: Entity) {
  emits('entitySelected', entity)
}

onMounted(() => {})
</script>

<template>
  <div class="scene-hierarchy">
    <span>Scene</span>
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
}
</style>
