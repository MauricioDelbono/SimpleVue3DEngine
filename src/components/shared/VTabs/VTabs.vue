<script setup lang="ts">
import { computed, provide, reactive, ref, type Ref } from 'vue'

interface ITab {
  id: string
  name: string
}

const props = defineProps({
  defaultTab: {
    type: String,
    required: false
  }
})

const tabsContainer: Ref<HTMLElement> = ref(document.body)
const state = reactive({
  activeTab: {} as ITab,
  tabs: [] as ITab[]
})

const setActiveTab = (tabId: string) => {
  state.activeTab = state.tabs.find((tab) => tab.id === tabId) ?? state.tabs[0]
}

const isActiveTab = (tabId: string) => {
  return state.activeTab.id === tabId
}

const registerTab = (id: string, name: string) => {
  state.tabs.push({ id, name })
  state.activeTab = state.tabs[0]
}

const tabElement = computed(() => {
  return tabsContainer.value.querySelector(`#${state.activeTab.id}`)
})

const indicatorOffset = computed(() => {
  if (!tabElement.value) return 0

  const tabLeft = tabElement.value.getBoundingClientRect().left
  const containerLeft = tabsContainer.value.getBoundingClientRect().left ?? 0
  return tabLeft - containerLeft
})

const indicatorWidth = computed(() => {
  return tabElement.value ? tabElement.value.getBoundingClientRect().width : 100
})

provide('registerTab', registerTab)
provide('isActiveTab', isActiveTab)
</script>

<template>
  <div class="v-tabs">
    <div ref="tabsContainer" class="v-tabs-container">
      <div v-for="tab in state.tabs" :key="tab.id" :id="tab.id" class="v-tabs-item" @click="setActiveTab(tab.id)">
        {{ tab.name }}
      </div>
      <div class="v-tabs-indicator" :style="{ transform: `translateX(${indicatorOffset}px)`, width: `${indicatorWidth}px` }"></div>
    </div>

    <slot :setActiveTab="setActiveTab" />
  </div>
</template>

<style scoped lang="scss">
.v-tabs {
  width: 100%;
  height: 100%;

  &-container {
    position: relative;
    display: flex;
    border-bottom: 1px solid var(--border-color);
  }

  &-item {
    cursor: pointer;
    padding: 8px 16px;

    &:hover {
      background-color: var(--item-color-hover);
    }

    &:active {
      background-color: var(--item-color-active);
    }
  }

  &-indicator {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 2px;
    background-color: var(--primary-color);
    transition: transform 0.15s linear;
  }
}
</style>
