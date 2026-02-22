<script setup lang="ts">
import { useCamera } from '@/composables/camera'
import { useInputStore } from '@/stores/input'
import { useRenderStore } from '@/stores/render'
import { useWebGLStore } from '@/stores/webgl'
import RenderEngine from '@/components/RenderEngine.vue'
import { vec3 } from 'gl-matrix'
import { useAssetsStore } from '@/stores/assets'
import { storeToRefs } from 'pinia'
import Primitives from '@/helpers/primitives'
import { GLTFLoader } from '@/loaders/gltf'
import sponzaUrl from '@/assets/models/sponza.glb?url'

const renderStore = useRenderStore()
const { scene } = storeToRefs(renderStore)
const assetsStore = useAssetsStore()
const { meshes } = storeToRefs(assetsStore)
const inputStore = useInputStore()
const webglStore = useWebGLStore()
const camera = useCamera()

async function loadAssets() {
  assetsStore.addMesh('cube', Primitives.createCube())

  const loader = new GLTFLoader()
  const sponza = await loader.load(webglStore.gl, sponzaUrl)
  scene.value.entities.push(sponza)
}

async function initialize(done: () => {}) {
  inputStore.initialize()
  scene.value.fog.color = [0.0, 0.0, 0.0, 1]
  scene.value.camera.transform.position = vec3.fromValues(0, 5, 0)
  scene.value.camera.transform.rotation = vec3.fromValues(0, 90, 0)
  camera.initialize()

  await loadAssets()

  const dirLight = scene.value.createDirectionalLight([0, 20, 0], meshes.value.cube)
  dirLight.transform.scale = vec3.fromValues(0.2, 0.2, 1)
  dirLight.transform.rotation = vec3.fromValues(60, 30, 0)
  dirLight.diffuse = vec3.fromValues(1.0, 0.95, 0.85)
  dirLight.ambient = vec3.fromValues(0.2, 0.22, 0.3)
  dirLight.specular = vec3.fromValues(1.0, 1.0, 1.0)

  done()
}
</script>

<template>
  <RenderEngine @ready="initialize" />
</template>

<style scoped lang="scss"></style>
