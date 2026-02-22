<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import VPusher from '@/components/shared/VPusher/VPusher.vue'
import { scenes, getSceneById } from '@/scenes/registry'

const selectedSceneId = ref(scenes[0].id)

const currentScene = computed(() => {
  return getSceneById(selectedSceneId.value) || scenes[0]
})

onMounted(() => {
  const stored = localStorage.getItem('selected-scene-id')
  if (stored && getSceneById(stored)) {
    selectedSceneId.value = stored
  }
})

watch(selectedSceneId, (newId) => {
  localStorage.setItem('selected-scene-id', newId)
})
</script>

<template>
  <VPusher id="main-menu" :min-width="200" :max-width="600">
    <template #menu>
      <div class="scene-list">
        <h3>Scenes</h3>
        <ul>
          <li
            v-for="scene in scenes"
            :key="scene.id"
            @click="selectedSceneId = scene.id"
            :class="{ active: selectedSceneId === scene.id }"
          >
            {{ scene.name }}
          </li>
        </ul>
      </div>
    </template>
    <template #content>
      <component :is="currentScene.component" :key="currentScene.id" />
    </template>
  </VPusher>
</template>

<style lang="scss">
@import './App.scss';

.scene-list {
  padding: 1rem;
  color: var(--text-color);

  h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.5rem;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  li {
    padding: 0.5rem 1rem;
    cursor: pointer;
    border-radius: 4px;
    margin-bottom: 4px;
    transition: background-color 0.2s;

    &:hover {
      background-color: var(--item-color-hover);
    }

    &.active {
      background-color: var(--primary-color);
      color: white;
    }
  }
}
</style>
