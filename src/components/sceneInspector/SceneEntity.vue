<script setup lang="ts">
import { useRenderStore } from '@/stores/render'
import { storeToRefs } from 'pinia'
import { Entity } from '@/models/entity'
import VInput from '../shared/VInput/VInput.vue'

const props = defineProps({
  entity: {
    type: Entity,
    required: true
  }
})

const store = useRenderStore()
const { scene } = storeToRefs(store)
const entity = props.entity
const transform = props.entity.transform
const material = props.entity.material
const mesh = props.entity.mesh
</script>

<template>
  <div v-if="props.entity" class="scene-entity">
    <div class="scene-entity-prop">UUID: {{ props.entity.uuid }}</div>
    <div class="scene-entity-prop">
      <span>Name:</span>
      <VInput v-model="entity.name" block />
    </div>
    <div class="transform card">
      <div class="card-title">Transform</div>

      <div class="scene-entity-prop">
        <span>Position:</span>
        <div style="flex: 1"></div>
        <VInput v-model="transform.position[0]" type="number" />
        <VInput v-model="transform.position[1]" type="number" />
        <VInput v-model="transform.position[2]" type="number" />
      </div>

      <div class="scene-entity-prop">
        <span>Rotation:</span>
        <div style="flex: 1"></div>
        <VInput v-model="transform.rotation[0]" type="number" />
        <VInput v-model="transform.rotation[1]" type="number" />
        <VInput v-model="transform.rotation[2]" type="number" />
      </div>

      <div class="scene-entity-prop">
        <span>Scale:</span>
        <div style="flex: 1"></div>
        <VInput v-model="transform.scale[0]" type="number" />
        <VInput v-model="transform.scale[1]" type="number" />
        <VInput v-model="transform.scale[2]" type="number" />
      </div>
    </div>

    <div class="material card">
      <div class="card-title">Material</div>

      <div class="scene-entity-prop">
        <span>Color:</span>
        <div style="flex: 1"></div>
        <VInput v-model="material.color[0]" type="number" />
        <VInput v-model="material.color[1]" type="number" />
        <VInput v-model="material.color[2]" type="number" />
      </div>

      <div class="scene-entity-prop">
        <span>Shininess:</span>
        <div style="flex: 1"></div>
        <VInput v-model="material.shininess" type="number" />
      </div>
    </div>

    <div class="mesh card">
      <div class="card-title">Mesh</div>
      TODO
    </div>
  </div>
</template>

<style scoped lang="scss">
.scene-entity {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  box-sizing: border-box;

  &-prop {
    display: flex;
    gap: 8px;
  }

  .transform,
  .material,
  .mesh {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 8px;
  }

  .card {
    border: 1px solid var(--border-color);
    padding: 8px;
    border-radius: 4px;
    background-color: var(--item-color);

    &-title {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 8px;
    }

    .v-input {
      width: 48px;
    }
  }
}
</style>
