<script setup lang="ts">
import RenderEngine from '@/components/RenderEngine.vue'
import Primitives from '@/helpers/primitives'
import { useRenderStore } from '@/stores/render'
import { vec3 } from 'gl-matrix'
import { useAssetsStore } from '@/stores/assets'
import { storeToRefs } from 'pinia'
import { Material } from '@/models/material'
import Textures from '@/helpers/texture'
import { ParticleSystem } from '@/models/particleSystem'
import { pipelineKeys } from '@/stores/webgl'

const renderStore = useRenderStore()
const { scene } = storeToRefs(renderStore)
const assetsStore = useAssetsStore()
const { textures, materials, meshes } = storeToRefs(assetsStore)

async function loadAssets() {
  // Use default white texture
  assetsStore.addTexture('particle', Textures.createDefaultTexture())
  assetsStore.addMaterial('particle', new Material(textures.value.particle))

  // Use a quad for particles
  assetsStore.addMesh('quad', Primitives.createXYQuad())
}

async function initialize(done: () => {}) {
  scene.value.fog.color = [0.1, 0.1, 0.1, 1]
  scene.value.camera.transform.position = vec3.fromValues(0, 5, 20)
  scene.value.camera.transform.lookAt(vec3.fromValues(0, 5, 0))

  await loadAssets()

  const emitter = scene.value.createEntity([0, 0, 0], meshes.value.quad, materials.value.particle)
  emitter.name = 'Particle Emitter'
  emitter.pipeline = pipelineKeys.particle

  const ps = new ParticleSystem(10000)
  ps.emissionRate = 500
  ps.lifetime = 3
  ps.speed = 5
  ps.startSize = 0.5
  ps.endSize = 0.1
  ps.startColor = vec3.fromValues(1, 0.8, 0.2) // Gold/Fire
  ps.endColor = vec3.fromValues(1, 0.1, 0) // Red
  ps.gravity = vec3.fromValues(0, 5, 0) // Upwards (Fire/Smoke)

  emitter.addComponent(ps)

  done()
}
</script>

<template>
  <div class="particle-scene">
    <RenderEngine auto-play @ready="initialize" />
  </div>
</template>

<style scoped lang="scss">
.particle-scene {
  width: inherit;
  height: inherit;
}
</style>
