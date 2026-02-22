<script setup lang="ts">
import VTreeNode from './VTreeNode.vue'

interface Item {
  uuid: string
  name: string
  children?: Item[]
  isRoot?: boolean
  isExpanded?: boolean
}

const props = defineProps({
  items: {
    type: Array as () => Item[],
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

function onItemSelected(item: Item) {
  emits('itemSelected', item)
}
</script>

<template>
  <div class="v-tree">
    <VTreeNode
      v-for="item in props.items"
      :key="item.uuid"
      :item="item"
      :selectedUuid="props.selectedUuid"
      :depth="props.depth"
      @itemSelected="onItemSelected"
    >
      <template #default="{ item: slotItem }">
        <slot :item="slotItem" />
      </template>
    </VTreeNode>
  </div>
</template>

<style scoped lang="scss">
.v-tree {
  display: flex;
  flex-direction: column;
}
</style>
