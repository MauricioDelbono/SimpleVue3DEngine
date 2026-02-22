<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  minWidth: {
    type: Number,
    default: 200
  },
  maxWidth: {
    type: Number,
    default: 500
  },
  id: {
    type: String,
    required: true
  }
})

const width = ref(300)
const isOpen = ref(true)
const isDragging = ref(false)

const storageKey = `v-pusher-${props.id}`

onMounted(() => {
  const stored = localStorage.getItem(storageKey)
  if (stored) {
    try {
      const data = JSON.parse(stored)
      width.value = Math.max(props.minWidth, Math.min(props.maxWidth, data.width))
      isOpen.value = data.isOpen
    } catch (e) {
      console.error('Failed to parse pusher settings', e)
    }
  }
})

watch([width, isOpen], () => {
  localStorage.setItem(storageKey, JSON.stringify({ width: width.value, isOpen: isOpen.value }))
})

function startDrag(e: MouseEvent) {
  isDragging.value = true
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDrag)
  // Prevent selection during drag
  document.body.style.userSelect = 'none'
}

function onDrag(e: MouseEvent) {
  if (!isDragging.value) return
  let newWidth = e.clientX
  // Clamp
  if (newWidth < props.minWidth) newWidth = props.minWidth
  if (newWidth > props.maxWidth) newWidth = props.maxWidth
  width.value = newWidth
}

function stopDrag() {
  isDragging.value = false
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
  document.body.style.userSelect = ''
}

function toggle() {
  isOpen.value = !isOpen.value
}
</script>

<template>
  <div class="v-pusher">
    <div
      class="v-pusher-menu"
      :style="{ width: isOpen ? width + 'px' : '0px', minWidth: isOpen ? width + 'px' : '0px' }"
    >
      <div class="v-pusher-content-wrapper">
         <slot name="menu"></slot>
      </div>
    </div>

    <div class="v-pusher-handle" @mousedown="startDrag">
      <div class="v-pusher-toggle" @click.stop="toggle" :title="isOpen ? 'Close Menu' : 'Open Menu'">
         <div class="arrow" :class="{ open: isOpen }"></div>
      </div>
    </div>

    <div class="v-pusher-content">
      <slot name="content"></slot>
    </div>
  </div>
</template>

<style scoped lang="scss">
.v-pusher {
  display: flex;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.v-pusher-menu {
  background-color: var(--item-color);
  border-right: 1px solid var(--border-color);
  transition: width 0.3s ease, min-width 0.3s ease;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
}

.v-pusher-content-wrapper {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  // Ensure content doesn't wrap weirdly during transition
  min-width: 100%;
}

.v-pusher-handle {
  width: 5px;
  background-color: var(--border-color);
  cursor: col-resize;
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &:hover {
    background-color: var(--primary-color);
  }
}

.v-pusher-toggle {
  position: absolute;
  left: 100%; // Align to right of handle
  background-color: var(--item-color);
  border: 1px solid var(--border-color);
  border-left: none;
  width: 20px;
  height: 40px;
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 20;

  &:hover {
    background-color: var(--item-color-hover);
  }
}

.arrow {
  width: 0;
  height: 0;
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
  border-left: 5px solid var(--text-color);
  transition: transform 0.3s;

  &.open {
    transform: rotate(180deg);
  }
}

.v-pusher-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}
</style>
