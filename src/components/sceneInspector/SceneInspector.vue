<script setup lang="ts">
import { ref, type Ref } from 'vue'
import SceneEntity from './SceneEntity.vue'
import SceneHierarchy from './SceneHierarchy.vue'
import type { Entity } from '@/models/entity'
import VTabs from '../shared/VTabs/VTabs.vue'
import VTab from '../shared/VTabs/VTab.vue'
import VIcon from '../shared/VIcon/VIcon.vue'
import SceneSettings from './SceneSettings.vue'

const selectedEntity: Ref<Entity | undefined> = ref(undefined)

function event_selectEntity(entity: Entity, setActiveTab: Function) {
  selectedEntity.value = entity
  setActiveTab('inspector')
}

function onMouseDown(event: MouseEvent) {
  const inspector = document.querySelector('.scene-inspector') as HTMLElement
  const initialX = event.clientX
  const initialWidth = inspector.offsetWidth

  function onMouseMove(event: MouseEvent) {
    const dx = event.clientX - initialX
    inspector.style.width = `${initialWidth - dx}px`
  }

  function onMouseUp() {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}
</script>

<template>
  <div class="scene-inspector">
    <div class="handle" @mousedown="onMouseDown">
      <VIcon name="drag" />
    </div>

    <VTabs v-slot="{ setActiveTab }">
      <VTab id="hierarchy" name="Hierarchy">
        <SceneHierarchy @entitySelected="event_selectEntity($event, setActiveTab)" />
      </VTab>
      <VTab id="inspector" name="Inspector">
        <SceneEntity v-if="selectedEntity" :entity="selectedEntity" />
      </VTab>
      <VTab id="settings" name="Settings">
        <SceneSettings />
      </VTab>
    </VTabs>
  </div>
</template>

<style scoped lang="scss">
.scene-inspector {
  position: relative;
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

  .handle {
    position: absolute;
    inset-block-start: 0;
    inset-inline-start: 0;
    left: -8px;
    top: calc(50% - 32px);
    height: 32px;
    display: flex;
    align-items: center;

    background-color: var(--background-color);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    cursor: ew-resize;

    .v-icon {
      height: 24px;
      margin-left: -4px;
      margin-right: -4px;
    }
  }
}
</style>
