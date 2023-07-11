<script setup lang="ts">
import RenderEngine from '@/components/RenderEngine.vue'
import FPSInfo from '@/components/FPSInfo.vue'
import { useCamera } from '@/composables/camera'
import Primitives from '@/helpers/primitives'
import Textures from '@/helpers/texture'
import type { Mesh } from '@/models/mesh'
import { SphereCollider } from '@/physics/collisions/sphereCollider'
import { Rigidbody } from '@/physics/dynamics/rigidBody'
import { useInputStore } from '@/stores/input'
import { useRenderStore } from '@/stores/render'
import { vec3 } from 'gl-matrix'

const renderStore = useRenderStore()
const inputStore = useInputStore()
const camera = useCamera()

let meshList: Mesh[] = []
let textureList: WebGLTexture[] = []

const initialize = async () => {
  inputStore.initialize()

  textureList.push(Textures.createDefaultTexture())
  meshList.push(Primitives.createSphere(1, 100, 100))
  meshList.push(Primitives.createSphere())

  // Static sphere
  const entity = renderStore.createEntity([0, -20, 0], meshList[0], textureList[0])
  entity.transform.scaleBy(vec3.fromValues(10, 10, 10))
  const rigidbody = new Rigidbody()
  rigidbody.isDynamic = false
  const collider = new SphereCollider(vec3.fromValues(0, 0, 0), 10)
  entity.addComponent(rigidbody)
  entity.addComponent(collider)

  // Create 1 sphere every 500ms, delete old ones
  setInterval(() => {
    const sphere = renderStore.createEntity([Math.random(), 5, Math.random()], meshList[1], textureList[0])
    const sphereRigidbody = new Rigidbody()
    const sphereCollider = new SphereCollider(vec3.fromValues(0, 0, 0), 1)
    sphere.addComponent(sphereRigidbody)
    sphere.addComponent(sphereCollider)

    // Cleanup old spheres
    if (renderStore.scene.entities.length > 20) {
      renderStore.removeEntity(renderStore.scene.entities[1])
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
