import { onMounted, ref, type Ref } from 'vue'
import { defineStore, storeToRefs } from 'pinia'
import { vec3 } from 'gl-matrix'
import Primitives from '@/helpers/primitives'
import { Entity } from '@/models/entity'
import type { Mesh } from '@/models/mesh'
import { Scene, Skybox } from '@/models/scene'
import { useWebGLStore } from './webgl'

interface Render {
  update: (time: number, renderDelta: number) => void
  lateUpdate: (time: number, renderDelta: number) => void
}

export const useRenderStore = defineStore('render', () => {
  const subscribers: Ref<Render[]> = ref([])
  const lastRenderTime = ref(0)
  const scene: Ref<Scene> = ref(new Scene())
  const { gl, pipelines } = storeToRefs(useWebGLStore())

  onMounted(() => {
    scene.value.camera.position = vec3.fromValues(0, 10, -25)
    scene.value.camera.rotation = vec3.fromValues(-25, 180, 0)
  })

  function subscribeToRender(subscriber: Render) {
    subscribers.value.push(subscriber)
  }

  const traverseTree = (entity: Entity, callback: (entity: Entity) => void) => {
    callback(entity)
    entity.children.forEach((child) => {
      traverseTree(child, callback)
    })
  }

  function createEntity(position: vec3, mesh: Mesh, texture: WebGLTexture, parent?: Entity): Entity {
    const entity = new Entity()
    entity.transform.position = position
    entity.mesh = mesh
    entity.material.diffuse = texture
    if (!parent) {
      scene.value.addEntity(entity)
    } else {
      parent.addChild(entity)
    }

    return entity
  }

  function removeEntity(entity: Entity) {
    scene.value.removeEntity(entity)
  }

  function setSkybox(texture: WebGLTexture) {
    const pipeline = pipelines.value.skybox
    gl.value.useProgram(pipeline.program)
    const mesh = Primitives.createXYQuad()

    const vao = gl.value.createVertexArray()
    gl.value.bindVertexArray(vao)

    const positionBuffer = gl.value.createBuffer()
    gl.value.bindBuffer(gl.value.ARRAY_BUFFER, positionBuffer)
    gl.value.bufferData(gl.value.ARRAY_BUFFER, new Float32Array(mesh.positions), gl.value.STATIC_DRAW)
    gl.value.bindBuffer(gl.value.ARRAY_BUFFER, positionBuffer)
    gl.value.vertexAttribPointer(pipeline.attributes.aPosition, 2, gl.value.FLOAT, false, 0, 0)
    gl.value.enableVertexAttribArray(pipeline.attributes.aPosition)
    const indicesBuffer = gl.value.createBuffer()
    gl.value.bindBuffer(gl.value.ELEMENT_ARRAY_BUFFER, indicesBuffer)
    gl.value.bufferData(gl.value.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indices), gl.value.STATIC_DRAW)
    gl.value.bindBuffer(gl.value.ELEMENT_ARRAY_BUFFER, indicesBuffer)
    gl.value.bindVertexArray(null)

    mesh.vao = vao
    scene.value.skybox = new Skybox(texture, mesh, pipeline)
  }

  return { subscribers, lastRenderTime, scene, subscribeToRender, createEntity, setSkybox, traverseTree, removeEntity }
})
