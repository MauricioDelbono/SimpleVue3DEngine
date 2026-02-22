<script setup lang="ts">
import { ref, type Ref } from 'vue'
import SceneEntity from './SceneEntity.vue'
import SceneHierarchy from './SceneHierarchy.vue'
import type { Entity } from '@/models/entity'
import VIcon from '../shared/VIcon/VIcon.vue'
import SceneSettings from './SceneSettings.vue'

const selectedEntity: Ref<Entity | undefined> = ref(undefined)

function event_selectEntity(entity: Entity) {
  selectedEntity.value = entity
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

    <div class="inspector-pane hierarchy-pane">
      <div class="pane-header">Hierarchy</div>
      <SceneHierarchy :selectedEntity="selectedEntity" @entitySelected="event_selectEntity" />
    </div>

    <div v-if="selectedEntity" class="pane-divider"></div>

    <div v-if="selectedEntity" class="inspector-pane entity-pane">
      <div class="pane-header">Inspector</div>
      <SceneEntity :entity="selectedEntity" />
    </div>

    <!-- Settings could be another pane or a toggle. User didn't specify.
         But old code had a 'Settings' tab.
         I should probably keep it accessible?
         Maybe add it to the bottom or top bar?
         User request focused on Hierarchy -> Inspector transition.
         I'll put Settings at the very bottom or just omit for now if not critical,
         but removing features is bad.
         I'll add a small settings button or keep it as a collapsible section at the bottom?

         Actually, let's just append it at the bottom for now, maybe collapsed?
         Or just put it below the entity inspector.
    -->
    <div class="pane-divider"></div>
    <div class="inspector-pane settings-pane">
       <div class="pane-header">Settings</div>
       <SceneSettings />
    </div>

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
  height: 100%;
  /* Assuming parent container has height. If not, flex might not work perfectly for scrolling. */

  .inspector-pane {
    display: flex;
    flex-direction: column;
    overflow-y: auto;

    &.hierarchy-pane {
      flex: 1;
      /* Hierarchy takes available space, shrinks if Inspector is present */
      min-height: 200px;
    }

    &.entity-pane {
      flex: 1;
      /* Inspector shares space */
      border-top: 1px solid var(--border-color);
    }

    &.settings-pane {
      flex: 0 0 auto;
      max-height: 200px; /* Limit settings height */
      border-top: 1px solid var(--border-color);
    }
  }

  .pane-header {
    padding: 8px 16px;
    font-weight: bold;
    background-color: var(--item-color);
    border-bottom: 1px solid var(--border-color);
    position: sticky;
    top: 0;
    z-index: 1;
  }

  .pane-divider {
    height: 1px;
    background-color: var(--border-color);
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
    z-index: 10;

    .v-icon {
      height: 24px;
      margin-left: -4px;
      margin-right: -4px;
    }
  }
}
</style>
