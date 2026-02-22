<script setup lang="ts">
import { computed } from 'vue'
import { useRenderStore } from '@/stores/render'
import { storeToRefs } from 'pinia'
import { Entity } from '@/models/entity'
import VTree from '../shared/VTree/VTree.vue'
import VIcon from '../shared/VIcon/VIcon.vue'

const emits = defineEmits(['entitySelected'])

const store = useRenderStore()
const { scene } = storeToRefs(store)

const props = defineProps({
  selectedEntity: {
    type: Entity,
    default: null
  }
})

function event_entitySelected(item: any) {
  if (item.uuid === 'scene-root') return
  emits('entitySelected', item as Entity)
}

function getIcon(item: any): string {
  if (item.uuid === 'scene-root') return 'folder'

  const entity = item as Entity

  // Check components by name to avoid import issues
  const componentNames = entity.components.map(c => c.constructor.name)

  if (componentNames.some(n => n.includes('Light'))) return 'lightbulb'
  if (componentNames.some(n => n.includes('Camera'))) return 'video'

  // Check if it's a mesh (non-empty)
  if (entity.mesh && entity.mesh.name !== 'Empty') {
    return 'cube'
  }

  // Default to folder for empty/transform nodes
  return 'folder'
}

const rootItems = computed(() => {
  if (!scene.value) return []

  return [{
    uuid: 'scene-root',
    name: 'Scene',
    children: scene.value.entities,
    isRoot: true,
    isExpanded: true
  }]
})
</script>

<template>
  <div class="scene-hierarchy">
    <VTree
      v-if="scene"
      :items="rootItems"
      :selectedUuid="props.selectedEntity?.uuid"
      @itemSelected="event_entitySelected"
    >
      <template #default="{ item }">
        <div class="tree-node-content">
          <VIcon :name="getIcon(item)" size="sm" />
          <span>{{ item.name }}</span>
        </div>
      </template>
    </VTree>
  </div>
</template>

<style scoped lang="scss">
.scene-hierarchy {
  display: flex;
  flex-direction: column;
  padding: 8px;
  overflow-y: auto;
  flex: 1;

  .tree-node-content {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}
</style>
