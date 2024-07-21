<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], required: true }
})

const emits = defineEmits(['update:modelValue', 'change'])

const value = ref(props.modelValue)

function event_updateValue() {
  emits('update:modelValue', value.value)
  emits('change', value.value)
}

watch(
  () => props.modelValue,
  (newValue) => {
    value.value = newValue
  }
)
</script>

<template>
  <input v-model="value" v-bind="$attrs" class="input" @change="event_updateValue" />
</template>

<style scoped lang="scss">
input {
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
