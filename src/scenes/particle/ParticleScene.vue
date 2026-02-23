<script setup lang="ts">
import RenderEngine from '@/components/RenderEngine.vue'
import Primitives from '@/helpers/primitives'
import { useRenderStore } from '@/stores/render'
import { vec3, vec4 } from 'gl-matrix'
import { useAssetsStore } from '@/stores/assets'
import { storeToRefs } from 'pinia'
import { ParticleSystem } from '@/models/particleSystem'
import { pipelineKeys } from '@/stores/webgl'

const renderStore = useRenderStore()
const { scene } = storeToRefs(renderStore)
const assetsStore = useAssetsStore()
const { meshes } = storeToRefs(assetsStore)

async function loadAssets() {
  assetsStore.addMesh('quadMesh', Primitives.createXYQuad(1))
}

async function initialize(done: () => void) {
  scene.value.fog.color = [0.0, 0.0, 0.0, 1]
  scene.value.camera.transform.rotation = vec3.fromValues(0, 0, 0)
  scene.value.camera.transform.position = vec3.fromValues(0, 0, 20)

  await loadAssets()

  const emitter = scene.value.createEntity([0, -5, 0], meshes.value.quadMesh)
  emitter.name = 'Particle Emitter'
  // Important: Set the pipeline for the entity
  emitter.pipeline = pipelineKeys.particle

  const particleSystem = new ParticleSystem(10000)
  particleSystem.emissionRate = 500
  particleSystem.lifetime = 3.0
  particleSystem.size = 0.1
  particleSystem.speed = 5.0
  particleSystem.color = vec4.fromValues(0.2, 0.6, 1.0, 1.0)
  particleSystem.spread = 0.5
  particleSystem.direction = vec3.fromValues(0, 1, 0)

  emitter.addComponent(particleSystem)

  done()
}
</script>

<template>
  <div class="particle-scene">
    <RenderEngine @ready="initialize" />
  </div>
</template>

<style scoped lang="scss">
.particle-scene {
  width: inherit;
  height: 100%;
}
</style>
