<script setup lang="ts">
import { useCamera } from '@/composables/camera'
import Primitives from '@/helpers/primitives'
import { useInputStore } from '@/stores/input'
import { useRenderStore } from '@/stores/render'
import RenderEngine from '@/components/RenderEngine.vue'
import FPSInfo from '@/components/FPSInfo.vue'
import Textures from '@/helpers/texture'

const renderStore = useRenderStore()
const inputStore = useInputStore()
const camera = useCamera()

const initialize = async () => {
  inputStore.initialize()
  renderStore.scene.fogColor = [0.0, 0.0, 0.0, 1]
  renderStore.scene.defaultPipeline = 'hdr'

  const cubeMesh = Primitives.createCube()
  const sphereMesh = Primitives.createSphere()
  const planeMesh = Primitives.createPlane()

  const defaultTexture = Textures.createDefaultTexture()
  const containerDiffuse = await Textures.createTextureFromImage('./src/assets/images/containerDiffuse.png')
  const containerSpecular = await Textures.createTextureFromImage('./src/assets/images/containerSpecular.png')
  const containerEmission = await Textures.createTextureFromImage('./src/assets/images/containerEmission.jpg')

  const lightCube = renderStore.createLight([5, 5, 0], cubeMesh)
  const cube = renderStore.createEntity([-5, 0, 0], cubeMesh, null)
  cube.hdrMaterial.diffuse = containerDiffuse
  cube.hdrMaterial.specular = containerSpecular
  cube.hdrMaterial.emission = containerEmission
  const sphere = renderStore.createEntity([0, 2, 5], sphereMesh, defaultTexture)
  sphere.hdrMaterial.albedo = [0.4, 0.2, 0.2]
  const plane = renderStore.createEntity([0, -5, 0], planeMesh, defaultTexture)
  plane.hdrMaterial.albedo = [1, 0.5, 0.31]
}
</script>

<template>
  <RenderEngine @ready="initialize">
    <FPSInfo />
  </RenderEngine>
</template>

<style scoped lang="scss"></style>
