<script setup lang="ts">
import RenderEngine from '@/components/RenderEngine.vue'
import FPSInfo from '@/components/FPSInfo.vue'
import Primitives from '@/helpers/primitives'
import { SphereCollider } from '@/physics/collisions/sphereCollider'
import { Rigidbody } from '@/physics/dynamics/rigidBody'
import { useRenderStore } from '@/stores/render'
import { vec3 } from 'gl-matrix'
import { useAssetsStore } from '@/stores/assets'
import { storeToRefs } from 'pinia'
import SceneInspector from '@/components/sceneInspector/SceneInspector.vue'
import SceneControls from '@/components/SceneControls.vue'
import { Material } from '@/models/material'
import Textures from '@/helpers/texture'
import { PlaneCollider } from '@/physics/collisions/planeCollider'

const renderStore = useRenderStore()
const { scene } = storeToRefs(renderStore)
const assetsStore = useAssetsStore()
const { textures, materials, meshes } = storeToRefs(assetsStore)

async function loadAssets() {
  assetsStore.addTexture('chessBoard', await Textures.createTextureFromImage('./src/assets/images/chessBoard.png'))
  assetsStore.addMaterial('chessBoard', new Material(textures.value.chessBoard))

  assetsStore.addMesh('bigSphereMesh', Primitives.createSphere(1, 100, 100))
  assetsStore.addMesh('sphereMesh', Primitives.createSphere())
  assetsStore.addMesh('planeMesh', Primitives.createPlane(100, 100, 1, 1))
}

async function initialize(done: () => {}) {
  scene.value.fog.color = [0.0, 0.0, 0.0, 1]
  scene.value.camera.transform.position = vec3.fromValues(0, 0, -25)
  scene.value.camera.transform.rotation = vec3.fromValues(15, 0, 0)

  await loadAssets()

  // Static sphere
  const entity = scene.value.createEntity([0, -20, 0], meshes.value.bigSphereMesh)
  entity.transform.scaleBy(vec3.fromValues(10, 10, 10))
  const rigidbody = new Rigidbody()
  rigidbody.isDynamic = false
  const collider = new SphereCollider()
  entity.addComponent(rigidbody)
  entity.addComponent(collider)

  // Static Plane
  const plane = scene.value.createEntity([0, -20, 0], meshes.value.planeMesh)
  const planeRigidbody = new Rigidbody()
  planeRigidbody.isDynamic = false
  const planeCollider = new PlaneCollider()
  plane.addComponent(planeRigidbody)
  plane.addComponent(planeCollider)

  // directional light
  const dirLight = scene.value.createDirectionalLight([0, 0, 0])
  dirLight.transform.rotation = [45, 0, 0]

  // Create 1 sphere every 500ms, delete old ones
  setInterval(() => {
    const sphere = scene.value.createEntity([Math.random(), 5, Math.random()], meshes.value.sphereMesh, materials.value.chessBoard)
    sphere.name = 'Sphere (Instance)'
    const sphereRigidbody = new Rigidbody()
    const sphereCollider = new SphereCollider()
    sphere.addComponent(sphereRigidbody)
    sphere.addComponent(sphereCollider)

    // Cleanup old spheres
    if (scene.value.entities.length > 20) {
      scene.value.removeEntity(scene.value.entities[2])
    }
  }, 500)

  done()
}
</script>

<template>
  <RenderEngine autoPlay @ready="initialize">
    <template #default>
      <FPSInfo />
      <SceneControls />
    </template>

    <template #right>
      <SceneInspector />
    </template>
  </RenderEngine>
</template>

<style scoped lang="scss"></style>
