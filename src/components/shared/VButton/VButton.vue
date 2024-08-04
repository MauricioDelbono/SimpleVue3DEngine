<script setup lang="ts">
import VIcon from '@/components/shared/VIcon/VIcon.vue'

const props = defineProps({
  icon: {
    type: Boolean,
    required: false,
    default: false
  },
  iconLeft: {
    type: [String, Boolean],
    required: false,
    default: false
  },
  iconRight: {
    type: [String, Boolean],
    required: false,
    default: false
  }
})
</script>

<template>
  <button class="v-button" v-bind="$attrs">
    <VIcon v-if="props.iconLeft" :name="props.iconLeft" />
    <slot v-if="!props.icon" />
    <VIcon v-if="props.iconRight" :name="props.iconRight" />
  </button>
</template>

<style scoped lang="scss">
.v-button {
  background: #2d2d2d;
  border: 1px solid gray;
  border-radius: 4px;
  padding: 4px 10px;
  color: white;

  &:disabled {
    opacity: 0.5;
  }

  &:hover {
    cursor: pointer;
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
}
</style>
