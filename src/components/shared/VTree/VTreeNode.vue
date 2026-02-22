<script setup lang="ts">
import { ref, computed } from 'vue'
import VIcon from '../../VIcon/VIcon.vue'
import VTree from './VTree.vue'

interface Item {
  uuid: string
  name: string
  children?: Item[]
  isRoot?: boolean
  isExpanded?: boolean
}

const props = defineProps({
  item: {
    type: Object as () => Item,
    required: true
  },
  selectedUuid: {
    type: String,
    default: null
  },
  depth: {
    type: Number,
    default: 0
  }
})

const emits = defineEmits(['itemSelected'])

const isExpanded = ref(props.item.isExpanded || !!props.item.isRoot)

function toggleExpand() {
  if (props.item.isRoot) return
  isExpanded.value = !isExpanded.value
}

function selectItem() {
  emits('itemSelected', props.item)
}

function onChildSelected(item: Item) {
  emits('itemSelected', item)
}

const hasChildren = computed(() => props.item.children && props.item.children.length > 0)

const indentStyle = computed(() => {
  return {
    paddingLeft: `${props.depth * 8}px`
  }
})
</script>

<template>
  <div class="v-tree-node">
    <div
      class="node-content"
      :class="{ selected: props.selectedUuid === props.item.uuid, root: props.item.isRoot }"
      :style="indentStyle"
      @click.stop="selectItem"
    >
      <!-- Chevron Toggle -->
      <div class="toggle-icon" @click.stop="toggleExpand">
        <VIcon
          v-if="hasChildren && !props.item.isRoot"
          :name="isExpanded ? 'chevron-down' : 'chevron-right'"
          size="sm"
        />
        <div v-else-if="!props.item.isRoot" class="spacer"></div>
      </div>

      <!-- Content Slot -->
      <slot :item="props.item" />
    </div>

    <!-- Recursive Children -->
    <div v-if="isExpanded && hasChildren" class="children">
      <VTree
        :items="props.item.children!"
        :selectedUuid="props.selectedUuid"
        :depth="props.depth + 1"
        @itemSelected="onChildSelected"
      >
        <template #default="{ item }">
          <slot :item="item" />
        </template>
      </VTree>
    </div>
  </div>
</template>

<style scoped lang="scss">
.v-tree-node {
  display: flex;
  flex-direction: column;

  .node-content {
    display: flex;
    align-items: center;
    padding: 4px 8px;
    cursor: pointer;
    border-radius: 4px;
    user-select: none;
    gap: 4px;

    &:hover {
      background-color: var(--item-color-hover);
    }

    &.selected {
      background-color: var(--primary-color);
      color: white;

      :deep(.v-icon) {
        color: white;
      }
    }

    &.root {
      font-weight: bold;
      pointer-events: none; // Root is not selectable? Or just not collapsible.
      // User said "root node... is always opened". Assuming selectable too if it's an entity,
      // but here it's a wrapper. If "Scene" is just a label, pointer-events: none might be right for selection
      // but toggle is handled separately.
      // Let's keep it simple. If it has a UUID, it might be selectable.
      // Current SceneHierarchy passes a fake UUID. Let's make it selectable if needed,
      // but usually scene root selects the scene itself.
      // For now, allow selection if it has a valid handler upstream.
      pointer-events: auto;
    }

    .toggle-icon {
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;

      .spacer {
        width: 16px;
      }
    }
  }

  .children {
    display: flex;
    flex-direction: column;
  }
}
</style>
