<script setup lang="ts">
import { useCamera } from '@/composables/camera'
import Primitives from '@/helpers/primitives'
import type { Mesh } from '@/models/mesh'
import { useInputStore } from '@/stores/input'
import { useRenderStore } from '@/stores/render'
import RenderEngine from '@/components/RenderEngine.vue'
import FPSInfo from '@/components/FPSInfo.vue'

const renderStore = useRenderStore()
const inputStore = useInputStore()
const camera = useCamera()

let meshList: Mesh[] = []

const initialize = async () => {
  inputStore.initialize()
  renderStore.scene.fogColor = [0.0, 0.0, 0.0, 1]
  renderStore.scene.defaultPipeline = 'hdr'

  meshList.push(Primitives.createCube())

  const lightCube = renderStore.createEntity([5, 5, 0], meshList[0], null)
  lightCube.pipeline = 'light'
  renderStore.scene.lights.push(lightCube)
  const cube = renderStore.createEntity([-5, 0, 0], meshList[0], null)
  cube.material.albedo = [1, 0.2, 0.2, 1]
}
</script>

<template>
  <RenderEngine @ready="initialize">
    <FPSInfo />
  </RenderEngine>
</template>

<style scoped lang="scss"></style>
