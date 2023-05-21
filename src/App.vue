<script setup lang="ts">
import type { Mesh } from './models/mesh'
import RenderEngine from './components/RenderEngine.vue'
import FPSInfo from './components/FPSInfo.vue'
import { useRenderStore } from './stores/render'
import { useInputStore } from './stores/input'
import Textures from './helpers/texture'
import Primitives from './helpers/primitives'
import { useCamera } from './composables/camera'
import { ExampleComponent } from './examples/exampleComponent'

const renderStore = useRenderStore()
const inputStore = useInputStore()
const camera = useCamera()

let meshList: Mesh[] = []
let textureList: WebGLTexture[] = []

const initialize = async () => {
  inputStore.initialize()
  textureList.push(Textures.createDefaultTexture())
  textureList.push(Textures.createTexture())
  textureList.push(await Textures.createTextureFromImage('./src/assets/images/subaru.jpg'))
  meshList.push(Primitives.createCube())
  meshList.push(Primitives.createSphere())
  meshList.push(Primitives.createTruncatedCone())
  meshList.push(Primitives.createPlane())

  const skyBox = await Textures.createSkyBoxTextureFromOneSource('./src/assets/images/skybox1.png')
  renderStore.setSkybox(skyBox)

  const entity1 = renderStore.createEntity([0, 0, 0], meshList[1], textureList[0])
  entity1.material.albedo = [1, 0.2, 0.2, 1]
  entity1.material.roughness = 90
  entity1.addComponent(new ExampleComponent(entity1))
  const entity2 = renderStore.createEntity([3, 1, 0], meshList[0], textureList[2])
  entity2.material.roughness = 90
  const entity3 = renderStore.createEntity([-3, -1, 0], meshList[2], textureList[1])
  entity3.material.albedo = [0.1, 0.2, 1, 1]
  entity3.material.roughness = 10
  const entity4 = renderStore.createEntity([0, -5, 0], meshList[3], textureList[0])
  entity4.material.roughness = 90

  const entity11 = renderStore.createEntity([0, 0, 10], meshList[0], textureList[0], entity1)
}
</script>

<template>
  <RenderEngine @ready="initialize">
    <FPSInfo />
  </RenderEngine>
</template>

<style scoped lang="scss"></style>
