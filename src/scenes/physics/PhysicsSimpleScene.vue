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
import { BoxCollider } from '@/physics/collisions/boxCollider'

const renderStore = useRenderStore()
const { scene } = storeToRefs(renderStore)
const assetsStore = useAssetsStore()
const { textures, materials, meshes } = storeToRefs(assetsStore)

async function loadAssets() {
  assetsStore.addTexture('chessBoard', await Textures.createTextureFromImage('./src/assets/images/chessBoard.png'))
  assetsStore.addMaterial('chessBoard', new Material(textures.value.chessBoard))

  assetsStore.addMesh('bigSphereMesh', Primitives.createSphere(1, 100, 100))
  assetsStore.addMesh('sphereMesh', Primitives.createSphere())
  assetsStore.addMesh('boxMesh', Primitives.createCube())
  assetsStore.addMesh('planeMesh', Primitives.createPlane(100, 100, 1, 1))
}

async function initialize(done: () => {}) {
  scene.value.fog.color = [0.0, 0.0, 0.0, 1]
  scene.value.camera.transform.rotation = vec3.fromValues(15, 0, 0)
  scene.value.camera.transform.position = vec3.fromValues(0, -10, -25)

  await loadAssets()

  // Static sphere
  // const entity = scene.value.createEntity([0, -20, 0], meshes.value.bigSphereMesh)
  // entity.transform.scaleBy(vec3.fromValues(10, 10, 10))
  // const rigidbody = new Rigidbody()
  // rigidbody.isDynamic = false
  // const collider = new SphereCollider()
  // entity.addComponent(rigidbody)
  // entity.addComponent(collider)

  // Static Plane
  // const plane = scene.value.createEntity([0, -20, 0], meshes.value.planeMesh)
  // plane.transform.rotate([10, 0, 0])
  // const planeRigidbody = new Rigidbody()
  // planeRigidbody.isDynamic = false
  // const planeCollider = new PlaneCollider(100, 100)
  // plane.addComponent(planeRigidbody)
  // plane.addComponent(planeCollider)

  // Box as floor
  const entity = scene.value.createEntity([0, -20, 0], meshes.value.boxMesh)
  entity.transform.scaleBy(vec3.fromValues(10, 1, 10))
  const rigidbody = new Rigidbody()
  rigidbody.isDynamic = false
  rigidbody.restitution = 0.5
  const collider = new BoxCollider()
  collider.size = vec3.fromValues(2, 2, 2) // Local size (mesh is 2x2x2, transform handles scaling)
  entity.addComponent(rigidbody)
  entity.addComponent(collider)

  // directional light
  const dirLight = scene.value.createDirectionalLight([0, 0, 0])
  dirLight.transform.rotation = [40, 0, 0]

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

// Create 1 box, delete old ones
function createBox() {
  // Cleanup previous box
  if (scene.value.entities.length > 2) {
    scene.value.removeEntity(scene.value.entities[2])
  }

  const box = scene.value.createEntity(
    [Math.random() * 2 - 1, 5, Math.random() * 2 - 1], // Changed from -15 to 5 to drop from above
    meshes.value.boxMesh,
    materials.value.chessBoard
  )
  box.name = 'Box (Instance)'
  box.transform.rotate([45, 0, 0])
  const boxRigidbody = new Rigidbody(1)
  const boxCollider = new BoxCollider()
  boxCollider.size = vec3.fromValues(2, 2, 2) // Local box size (mesh is 2x2x2)
  boxRigidbody.restitution = 0.5
  box.addComponent(boxRigidbody)
  box.addComponent(boxCollider)
}
</script>

<template>
  <div class="physics-simple-scene">
    <div class="custom-buttons">
      <VButton icon-left="plus" class="create-sphere" @click="createSphere">Create Sphere</VButton>
      <VButton icon-left="plus" class="create-box" @click="createBox">Create Box</VButton>
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
