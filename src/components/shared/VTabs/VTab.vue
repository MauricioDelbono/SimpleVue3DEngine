<script setup lang="ts">
import { v4 as uuid } from 'uuid'
import { inject, onMounted } from 'vue'

const props = defineProps({
  id: {
    type: String,
    required: false,
    default: 'tab-' + uuid()
  },
  name: {
    type: String,
    required: true
  }
})

const registerTab = inject<Function>('registerTab', () => {})
const isActiveTab = inject<Function>('isActiveTab', () => {})

onMounted(() => {
  registerTab(props.id, props.name)
})
</script>

<template>
  <div v-if="isActiveTab(props.id)" class="v-tab">
    <slot />
  </div>
</template>

<style scoped lang="scss">
.v-tab {
  width: inherit;
  height: inherit;
}
</style>
