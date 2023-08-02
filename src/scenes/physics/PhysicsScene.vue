<script setup lang="ts">
import RenderEngine from '@/components/RenderEngine.vue'
import FPSInfo from '@/components/FPSInfo.vue'
import { useCamera } from '@/composables/camera'
import Primitives from '@/helpers/primitives'
import { SphereCollider } from '@/physics/collisions/sphereCollider'
import { Rigidbody } from '@/physics/dynamics/rigidBody'
import { useInputStore } from '@/stores/input'
import { useRenderStore } from '@/stores/render'
import { vec3 } from 'gl-matrix'
import { useAssetsStore } from '@/stores/assets'
import { storeToRefs } from 'pinia'

const renderStore = useRenderStore()
const { scene } = storeToRefs(renderStore)
const inputStore = useInputStore()
const assetsStore = useAssetsStore()
const { meshes } = storeToRefs(assetsStore)
const camera = useCamera()

const loadAssets = async () => {
  assetsStore.addMesh('bigSphereMesh', Primitives.createSphere(1, 100, 100))
  assetsStore.addMesh('sphereMesh', Primitives.createSphere())
}

const initialize = async () => {
  inputStore.initialize()
  renderStore.scene.fog.color = [0.0, 0.0, 0.0, 1]

  await loadAssets()

  renderStore.startRender()

  // Static sphere
  const entity = scene.value.createEntity([0, -20, 0], meshes.value.bigSphereMesh)
  entity.transform.scaleBy(vec3.fromValues(10, 10, 10))
  const rigidbody = new Rigidbody()
  rigidbody.isDynamic = false
  const collider = new SphereCollider(vec3.fromValues(0, 0, 0), 10)
  entity.addComponent(rigidbody)
  entity.addComponent(collider)

  // directional light
  const dirLight = scene.value.createDirectionalLight([0, 0, 0])
  dirLight.transform.rotation = [45, 0, 0]

  // Create 1 sphere every 500ms, delete old ones
  setInterval(() => {
    const sphere = scene.value.createEntity([Math.random(), 5, Math.random()], meshes.value.sphereMesh)
    const sphereRigidbody = new Rigidbody()
    const sphereCollider = new SphereCollider(vec3.fromValues(0, 0, 0), 1)
    sphere.addComponent(sphereRigidbody)
    sphere.addComponent(sphereCollider)

    // Cleanup old spheres
    if (scene.value.entities.length > 20) {
      scene.value.removeEntity(scene.value.entities[1])
    }
  }, 500)
}
</script>

<template>
  <RenderEngine @ready="initialize">
    <FPSInfo />
  </RenderEngine>
</template>

<style scoped lang="scss"></style>
