<script setup lang="ts">
import { useCamera } from '@/composables/camera'
import Primitives from '@/helpers/primitives'
import { useInputStore } from '@/stores/input'
import { useRenderStore } from '@/stores/render'
import RenderEngine from '@/components/RenderEngine.vue'
import FPSInfo from '@/components/FPSInfo.vue'
import Textures from '@/helpers/texture'
import { vec3 } from 'gl-matrix'

const renderStore = useRenderStore()
const inputStore = useInputStore()
const camera = useCamera()

const initialize = async () => {
  inputStore.initialize()
  renderStore.scene.fogColor = [0.0, 0.0, 0.0, 1]
  renderStore.scene.defaultPipeline = 'hdr'

  const cubeMesh = Primitives.createCube()
  const sphereMesh = Primitives.createSphere()
  const planeMesh = Primitives.createPlane()

  const defaultTexture = Textures.createDefaultTexture()
  const containerDiffuse = await Textures.createTextureFromImage('./src/assets/images/containerDiffuse.png')
  const containerSpecular = await Textures.createTextureFromImage('./src/assets/images/containerSpecular.png')
  const containerEmission = await Textures.createTextureFromImage('./src/assets/images/containerEmission.jpg')

  const lightCube = renderStore.createPointLight([5, 5, -2], cubeMesh)
  lightCube.setLightAttenuation(100)
  lightCube.transform.scale = [0.2, 0.2, 0.2]
  lightCube.ambient = vec3.scale([0, 0, 0], [0, 1, 0], 0.2)
  lightCube.diffuse = vec3.scale([0, 0, 0], [0, 1, 0], 0.8)

  const lightCube2 = renderStore.createPointLight([-5, 0, 5], cubeMesh)
  lightCube2.setLightAttenuation(50)
  lightCube2.transform.scale = [0.2, 0.2, 0.2]
  lightCube2.ambient = vec3.scale([0, 0, 0], [1, 0, 0], 0.2)
  lightCube2.diffuse = vec3.scale([0, 0, 0], [1, 0, 0], 0.8)

  const spotLight = renderStore.createSpotLight([15, 5, 3], sphereMesh)
  spotLight.transform.scale = [0.2, 0.2, 1]
  spotLight.transform.rotation = [0, -90, 0]

  const dirLight = renderStore.createDirectionalLight([0, 0, 0], cubeMesh)
  dirLight.transform.scale = [0.2, 0.2, 1]
  dirLight.transform.rotation = [45, 0, 45]

  const cube = renderStore.createEntity([-5, 0, 0], cubeMesh, null)
  cube.hdrMaterial.diffuse = containerDiffuse
  cube.hdrMaterial.specular = containerSpecular
  cube.hdrMaterial.emission = containerEmission

  const sphere = renderStore.createEntity([0, 2, 5], sphereMesh, defaultTexture)
  sphere.hdrMaterial.albedo = [0.4, 0.2, 0.2]

  const plane = renderStore.createEntity([0, -5, 0], planeMesh, defaultTexture)
  plane.hdrMaterial.albedo = [1, 0.5, 0.31]

  const cube2 = renderStore.createEntity([10, 5, 2], cubeMesh, null)
  cube2.hdrMaterial.diffuse = containerDiffuse
  cube2.hdrMaterial.specular = containerSpecular
  cube2.hdrMaterial.shininess = 64.0
}
</script>

<template>
  <RenderEngine @ready="initialize">
    <FPSInfo />
  </RenderEngine>
</template>

<style scoped lang="scss"></style>
