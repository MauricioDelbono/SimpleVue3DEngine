<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import VIcon from '@/components/shared/VIcon/VIcon.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  block: {
    type: Boolean,
    required: false,
    default: false
  }
})

const emits = defineEmits(['update:modelValue', 'change'])

const value = ref(props.modelValue)

const checked = computed(() => value.value)

function event_updateValue(event: Event) {
  emits('update:modelValue', !value.value)
  emits('change', !value.value)
}

watch(
  () => props.modelValue,
  (newValue) => {
    value.value = newValue
  }
)
</script>

<template>
  <div class="v-checkbox" :class="{ block }">
    <input type="checkbox" class="v-checkbox-input" :checked="value" v-bind="$attrs" @change="event_updateValue" />
    <div class="v-checkbox-box">
      <VIcon v-if="checked" class="v-checkbox-icon" name="check" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.v-checkbox {
  position: relative;
  display: inline-flex;
  user-select: none;
  vertical-align: bottom;
  // width: ${dt('checkbox.width')};
  // height: ${dt('checkbox.height')};

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

  &.block {
    width: 100%;
  }

  &-input {
    cursor: pointer;
    appearance: none;
    position: absolute;
    inset-block-start: 0;
    inset-inline-start: 0;
    width: 100%;
    height: 100%;
    padding: 0;
    margin: 0;
    opacity: 0;
    z-index: 1;
    outline: 0 none;
    border: 1px solid transparent;
    border-radius: 0;
  }

  &-box {
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 4px;
    border: 1px solid gray;
    background: #2d2d2d;
    width: 24px;
    height: 24px;
    transition-property: background color border-color;
    transition-duration: 150ms;
  }

  &-icon {
    transition-duration: 150ms;
    color: white;
    font-size: 24px;
    width: 24px;
    height: 24px;
  }
}
</style>
