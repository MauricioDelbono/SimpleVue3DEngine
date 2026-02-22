<script setup lang="ts">
import { useCamera } from '@/composables/camera'
import Primitives from '@/helpers/primitives'
import { useInputStore } from '@/stores/input'
import { useRenderStore } from '@/stores/render'
import RenderEngine from '@/components/RenderEngine.vue'
import { vec3 } from 'gl-matrix'
import { useAssetsStore } from '@/stores/assets'
import { storeToRefs } from 'pinia'

const renderStore = useRenderStore()
const { scene } = storeToRefs(renderStore)
const assetsStore = useAssetsStore()
const { meshes } = storeToRefs(assetsStore)
const inputStore = useInputStore()
const camera = useCamera()

async function loadAssets() {
  assetsStore.addMesh('cube', Primitives.createCube())
  assetsStore.addMesh('sphere', Primitives.createSphere())
  assetsStore.addMesh('plane', Primitives.createPlane())
}

async function initialize(done: () => {}) {
  inputStore.initialize()
  scene.value.fog.color = [0.0, 0.0, 0.0, 1]
  scene.value.camera.transform.position = vec3.fromValues(-20, 21, -20)
  scene.value.camera.transform.rotation = vec3.fromValues(40, 45, 0)
  camera.initialize()

  await loadAssets()

  const dirLight = scene.value.createDirectionalLight([0, 10, 0], meshes.value.cube)
  dirLight.transform.scale = vec3.fromValues(0.2, 0.2, 1)
  dirLight.transform.rotation = vec3.fromValues(45, 0, 0)
  // dirLight.ambient = vec3.scale(dirLight.ambient, dirLight.ambient, 0.7)
  // dirLight.diffuse = vec3.scale(dirLight.diffuse, dirLight.diffuse, 0.7)
  // dirLight.specular = vec3.scale(dirLight.specular, dirLight.specular, 0.7)

  // const lightComponent = new lightMovement()
  // dirLight.addComponent(lightComponent)

  const cube = scene.value.createEntity([-5, 0, 0], meshes.value.cube)
  cube.material.color = [128, 0, 0]

  const sphere = scene.value.createEntity([0, 2, 5], meshes.value.sphere)
  sphere.material.color = [0, 128, 0]

  const cubeFloor = scene.value.createEntity([0, -2, 0], meshes.value.cube)
  cubeFloor.transform.scale = [15, 0.1, 15]
  cubeFloor.name = 'floor'

  done()
}
</script>

<template>
  <RenderEngine @ready="initialize" />
</template>

<style scoped lang="scss"></style>
