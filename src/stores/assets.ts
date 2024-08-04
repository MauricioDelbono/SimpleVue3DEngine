import { onMounted, ref, type Ref } from 'vue'
import { defineStore } from 'pinia'
import type { Mesh } from '@/models/mesh'
import type { Material } from '@/models/material'
import type { Pipeline } from '@/models/pipeline'
import type { Texture } from '@/models/types'

export const useAssetsStore = defineStore('assets', () => {
  const textures: Ref<Record<string, Texture>> = ref({})
  const meshes: Ref<Record<string, Mesh>> = ref({})
  const materials: Ref<Record<string, Material>> = ref({})
  const pipelines: Ref<Record<string, Pipeline>> = ref({})

  function reset() {
    textures.value = {}
    meshes.value = {}
    materials.value = {}
    pipelines.value = {}
  }

  function addTexture(key: string, texture: Texture): Texture {
    textures.value[key] = texture
    return texture
  }

  function addMesh(key: string, mesh: Mesh): Mesh {
    meshes.value[key] = mesh
    return mesh
  }

  function addMaterial(key: string, material: Material): Material {
    materials.value[key] = material
    return material
  }

  function addPipeline(key: string, pipeline: Pipeline): Pipeline {
    pipelines.value[key] = pipeline
    return pipeline
  }

  onMounted(() => {})

  return {
    textures,
    meshes,
    materials,
    pipelines,
    addTexture,
    addMesh,
    addMaterial,
    addPipeline,
    reset
  }
})
