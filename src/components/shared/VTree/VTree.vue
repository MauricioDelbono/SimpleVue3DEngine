<script setup lang="ts">
interface Item {
  uuid: string
  children?: Item[]
}

const props = defineProps({
  items: {
    type: Array<Item>,
    required: true
  }
})

const emits = defineEmits(['itemSelected'])

function click_item(item: Item) {
  emits('itemSelected', item)
}
</script>

<template>
  <div class="v-tree">
    <div v-for="item in props.items" :key="item.uuid" class="v-tree-item" @click="click_item(item)">
      <slot :item="item" />

      <VTree v-slot="{ item: child }" v-if="item.children?.length" :items="item.children">
        <slot :item="child" />
      </VTree>
    </div>
  </div>
</template>

<style scoped lang="scss">
.v-tree {
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-left: 1px solid var(--border-color);
  padding-left: 8px;
  margin-left: 8px;

  &-item {
    padding: 8px;
    border-radius: 4px;
    cursor: pointer;
    position: relative;

    &::before {
      content: '';
      border-top: 1px solid var(--border-color);
      position: absolute;
      top: 50%;
      left: -8px;
      width: 8px;
    }

    &:hover {
      background-color: var(--item-color-hover);
    }

    &:active {
      background-color: var(--item-color-active);
    }
  }
}
</style>
