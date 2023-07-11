<script setup lang="ts">
import { useCamera } from '@/composables/camera'
import Primitives from '@/helpers/primitives'
import Textures from '@/helpers/texture'
import type { Mesh } from '@/models/mesh'
import { SphereCollider } from '@/physics/collisions/sphereCollider'
import { Rigidbody } from '@/physics/dynamics/rigidBody'
import { useInputStore } from '@/stores/input'
import { useRenderStore } from '@/stores/render'
import { vec3 } from 'gl-matrix'
import { ExampleComponent } from './exampleComponent'
import RenderEngine from '@/components/RenderEngine.vue'
import FPSInfo from '@/components/FPSInfo.vue'

const renderStore = useRenderStore()
const inputStore = useInputStore()
const camera = useCamera()

let meshList: Mesh[] = []
let textureList: WebGLTexture[] = []

const initialize = async () => {
  inputStore.initialize()
  const skyBox = await Textures.createSkyBoxTextureFromOneSource('./src/assets/images/skybox1.png')
  renderStore.setSkybox(skyBox)

  textureList.push(Textures.createDefaultTexture())
  textureList.push(Textures.createTexture())
  textureList.push(await Textures.createTextureFromImage('./src/assets/images/subaru.jpg'))
  meshList.push(Primitives.createCube())
  meshList.push(Primitives.createSphere())
  meshList.push(Primitives.createTruncatedCone())
  meshList.push(Primitives.createPlane())

  const entity1 = renderStore.createEntity([0, 0, 0], meshList[1], textureList[0])
  entity1.material.albedo = [1, 0.2, 0.2, 1]
  entity1.material.roughness = 90
  entity1.addComponent(new ExampleComponent())
  const entity2 = renderStore.createEntity([3, 1, 0], meshList[0], textureList[2])
  entity2.material.roughness = 90
  const entity3 = renderStore.createEntity([-3, -1, 0], meshList[2], textureList[1])
  entity3.material.albedo = [0.1, 0.2, 1, 1]
  entity3.material.roughness = 10
  const entity4 = renderStore.createEntity([0, -7, 0], meshList[3], textureList[0])
  entity4.material.roughness = 90

  // Orbit object
  const entity11 = renderStore.createEntity([0, 0, 10], meshList[0], textureList[0], entity1)

  // Physics
  const entity5 = renderStore.createEntity([0, 5, -4], meshList[1], textureList[0])
  const sphereRigidbody = new Rigidbody()
  const sphereCollider = new SphereCollider(vec3.fromValues(0, 0, 0), 1)
  entity5.addComponent(sphereRigidbody)
  entity5.addComponent(sphereCollider)

  const entity6 = renderStore.createEntity([0.5, 0, -4], meshList[1], textureList[0])
  const sphere2Rigidbody = new Rigidbody()
  sphere2Rigidbody.isDynamic = false
  const sphere2Collider = new SphereCollider(vec3.fromValues(0, 0, 0), 1)
  entity6.addComponent(sphere2Rigidbody)
  entity6.addComponent(sphere2Collider)
}
</script>

<template>
  <RenderEngine @ready="initialize">
    <FPSInfo />
  </RenderEngine>
</template>

<style scoped lang="scss"></style>
