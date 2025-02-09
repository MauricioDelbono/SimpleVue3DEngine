<script setup lang="ts">
import RenderEngine from '@/components/RenderEngine.vue'
import Primitives from '@/helpers/primitives'
import { SphereCollider } from '@/physics/collisions/sphereCollider'
import { Rigidbody } from '@/physics/dynamics/rigidBody'
import { useRenderStore } from '@/stores/render'
import { vec3 } from 'gl-matrix'
import { useAssetsStore } from '@/stores/assets'
import { storeToRefs } from 'pinia'
import { Material } from '@/models/material'
import Textures from '@/helpers/texture'
import { PlaneCollider } from '@/physics/collisions/planeCollider'
import VButton from '@/components/shared/VButton/VButton.vue'

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
  const collider = new SphereCollider(undefined, 1)
  entity.addComponent(rigidbody)
  entity.addComponent(collider)

  // Static Plane
  const plane = scene.value.createEntity([0, -20, 0], meshes.value.planeMesh)
  plane.transform.rotate([10, 0, 0])
  const planeRigidbody = new Rigidbody()
  planeRigidbody.isDynamic = false
  const planeCollider = new PlaneCollider(undefined, 100, 100)
  plane.addComponent(planeRigidbody)
  plane.addComponent(planeCollider)

  // directional light
  const dirLight = scene.value.createDirectionalLight([0, 0, 0])
  dirLight.transform.rotation = [45, 0, 0]

  done()
}

// Create 1 sphere,  delete old ones
function createSphere() {
  // Cleanup previous sphere
  if (scene.value.entities.length > 3) {
    scene.value.removeEntity(scene.value.entities[3])
  }

  const sphere = scene.value.createEntity(
    [Math.random() * 2 - 1, 5, Math.random() * 2 - 1],
    meshes.value.sphereMesh,
    materials.value.chessBoard
  )
  sphere.name = 'Sphere (Instance)'
  const sphereRigidbody = new Rigidbody(1)
  const sphereCollider = new SphereCollider()
  sphere.addComponent(sphereRigidbody)
  sphere.addComponent(sphereCollider)
}
</script>

<template>
  <div class="physics-simple-scene">
    <div class="custom-buttons">
      <VButton icon-left="plus" class="create-sphere" @click="createSphere">Create Sphere</VButton>
    </div>

    <RenderEngine @ready="initialize" />
  </div>
</template>

<style scoped lang="scss">
.physics-simple-scene {
  width: inherit;
  height: inherit;
}

.custom-buttons {
  position: absolute;
  bottom: 0;
  left: 0;
  z-index: 1;

  display: flex;
  flex-direction: row;
  width: fit-content;
  background: none;
  gap: 8px;
  margin: 16px;
  padding: 10px;
}
</style>
