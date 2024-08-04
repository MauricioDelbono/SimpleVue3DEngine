<script setup lang="ts">
import { ref, type Ref } from 'vue'
import SceneEntity from './SceneEntity.vue'
import SceneHierarchy from './SceneHierarchy.vue'
import type { Entity } from '@/models/entity'
import VTabs from '../shared/VTabs/VTabs.vue'
import VTab from '../shared/VTabs/VTab.vue'

const selectedEntity: Ref<Entity | undefined> = ref(undefined)

function event_selectEntity(entity: Entity, setActiveTab: Function) {
  selectedEntity.value = entity
  setActiveTab('inspector')
}
</script>

<template>
  <div class="scene-inspector">
    <VTabs v-slot="{ setActiveTab }">
      <VTab id="hierarchy" name="Hierarchy">
        <SceneHierarchy @entitySelected="event_selectEntity($event, setActiveTab)" />
      </VTab>
      <VTab id="inspector" name="Inspector">
        <SceneEntity v-if="selectedEntity" :entity="selectedEntity" />
      </VTab>
    </VTabs>
  </div>
</template>

<style scoped lang="scss">
.scene-inspector {
  width: 350px;
  min-width: 350px;
  background-color: var(--background-color);
  color: var(--text-color);
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--border-color);

  .content {
    padding: 16px;
  }

  .directional {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .input {
    width: 48px;
  }
}
</style>
