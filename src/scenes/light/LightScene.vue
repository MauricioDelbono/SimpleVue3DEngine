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
  meshList.push(Primitives.createSphere())
  meshList.push(Primitives.createPlane())

  const lightCube = renderStore.createLight([5, 5, 0], meshList[0])
  const cube = renderStore.createEntity([-5, 0, 0], meshList[0], null)
  cube.hdrMaterial.ambient = [1, 0.5, 0.31]
  cube.hdrMaterial.diffuse = cube.hdrMaterial.ambient
  const sphere = renderStore.createEntity([0, 2, 5], meshList[1], null)
  sphere.hdrMaterial.ambient = [0.4, 0.2, 0.2]
  sphere.hdrMaterial.diffuse = sphere.hdrMaterial.ambient
  const plane = renderStore.createEntity([0, -5, 0], meshList[2], null)
  plane.hdrMaterial.ambient = [0.1, 0.4, 0.2]
  plane.hdrMaterial.diffuse = plane.hdrMaterial.ambient
}
</script>

<template>
  <RenderEngine @ready="initialize">
    <FPSInfo />
  </RenderEngine>
</template>

<style scoped lang="scss"></style>
