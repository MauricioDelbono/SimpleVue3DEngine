<script setup lang="ts">
import Primitives from '@/helpers/primitives'
import { useRenderStore } from '@/stores/render'
import RenderEngine from '@/components/RenderEngine.vue'
import FPSInfo from '@/components/FPSInfo.vue'
import Textures from '@/helpers/texture'
import { vec3 } from 'gl-matrix'
import { useAssetsStore } from '@/stores/assets'
import { Material } from '@/models/material'
import { storeToRefs } from 'pinia'
import SceneControls from '@/components/SceneControls.vue'
import containerDiffuseTexture from '@/assets/images/containerDiffuse.png'
import containerSpecularTexture from '@/assets/images/containerSpecular.png'
import containerEmissionTexture from '@/assets/images/containerEmission.jpg'

const renderStore = useRenderStore()
const { scene } = storeToRefs(renderStore)
const assetsStore = useAssetsStore()
const { textures, materials, meshes } = storeToRefs(assetsStore)

async function loadAssets() {
  assetsStore.addTexture('containerDiffuse', await Textures.createTextureFromImage(containerDiffuseTexture))
  assetsStore.addTexture('containerSpecular', await Textures.createTextureFromImage(containerSpecularTexture, false))
  assetsStore.addTexture('containerEmission', await Textures.createTextureFromImage(containerEmissionTexture))

  assetsStore.addMaterial('container', new Material(textures.value.containerDiffuse, textures.value.containerSpecular))
  assetsStore.addMaterial(
    'containerEmissive',
    new Material(textures.value.containerDiffuse, textures.value.containerSpecular, textures.value.containerEmission)
  )

  assetsStore.addMesh('cube', Primitives.createCube())
  assetsStore.addMesh('sphere', Primitives.createSphere())
  assetsStore.addMesh('plane', Primitives.createPlane())
}

async function initialize(done: () => void) {
  scene.value.fog.color = [0.0, 0.0, 0.0, 1]

  await loadAssets()

  const lightCube = scene.value.createPointLight([5, 5, -2], meshes.value.cube)
  lightCube.transform.scale = [0.2, 0.2, 0.2]
  lightCube.ambient = vec3.scale([0, 0, 0], [0, 1, 0], 0.2)
  lightCube.diffuse = vec3.scale([0, 0, 0], [0, 1, 0], 0.8)

  const lightCube2 = scene.value.createPointLight([-5, 0, 5], meshes.value.cube)
  lightCube2.transform.scale = [0.2, 0.2, 0.2]
  lightCube2.ambient = vec3.scale([0, 0, 0], [1, 0, 0], 0.2)
  lightCube2.diffuse = vec3.scale([0, 0, 0], [1, 0, 0], 0.8)

  const spotLight = scene.value.createSpotLight([15, 5, 3], meshes.value.sphere)
  spotLight.transform.scale = [0.2, 0.2, 1]
  spotLight.transform.rotation = [0, -90, 0]

  const dirLight = scene.value.createDirectionalLight([0, 20, -10], meshes.value.cube)
  dirLight.transform.scale = [0.2, 0.2, 1]
  dirLight.transform.rotation = [25, 0, 0]
  dirLight.ambient = vec3.scale(dirLight.ambient, dirLight.ambient, 0.7)
  dirLight.diffuse = vec3.scale(dirLight.diffuse, dirLight.diffuse, 0.7)
  dirLight.specular = vec3.scale(dirLight.specular, dirLight.specular, 0.7)

  const cube = scene.value.createEntity([-5, 0, 0], meshes.value.cube, materials.value.containerEmissive)

  const sphere = scene.value.createEntity([0, 2, 5], meshes.value.sphere, materials.value.default)
  sphere.material.color = [0.4, 0.2, 0.2]

  const plane = scene.value.createEntity([0, -5, 0], meshes.value.plane, materials.value.default)
  plane.transform.scale = [10, 1, 10]
  plane.material.color = [1, 0.5, 0.31]

  const cube2 = scene.value.createEntity([10, 5, 2], meshes.value.cube, materials.value.container)
  cube2.material.shininess = 64.0

  done()
}
</script>

<template>
  <RenderEngine autoPlay @ready="initialize">
    <FPSInfo />
    <SceneControls />
  </RenderEngine>
</template>

<style scoped lang="scss"></style>
