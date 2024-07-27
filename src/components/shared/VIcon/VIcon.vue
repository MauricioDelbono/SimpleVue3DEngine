<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  name: {
    type: String,
    required: true
  },
  size: {
    type: String,
    default: 'md',
    validator: (value: string) => ['sm', 'md', 'lg', 'xl'].includes(value)
  }
})

const iconName = computed(() => {
  return `${props.name}-icon`
})

const iconSize = computed(() => {
  switch (props.size) {
    case 'sm':
      return 16
    case 'md':
      return 24
    case 'lg':
      return 32
    case 'xl':
      return 40
    default:
      return 24
  }
})
</script>

<template>
  <component :is="iconName" class="v-icon" :class="{ [props.size]: true }" :size="iconSize" />
</template>

<style scoped lang="scss">
.v-icon {
  color: var(--text-color);
}
</style>
