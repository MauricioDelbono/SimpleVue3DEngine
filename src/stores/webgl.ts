import { ref, type Ref } from 'vue'
import { defineStore } from 'pinia'
import { mat4, vec3, vec4 } from 'gl-matrix'
import { Entity } from '@/models/entity'
import { Scene } from '@/models/scene'
import webgl from '@/helpers/webgl'
import utils from '@/helpers/utils'
import { DefaultPipeline, SkyboxPipeline, type Pipeline, LightPipeline, ShadowPipeline, QuadPipeline } from '@/models/pipeline'
import type { FrameBuffer, Texture } from '@/models/types'
import Primitives from '@/helpers/primitives'

export const useWebGLStore = defineStore('webgl', () => {
  const canvas: Ref<HTMLCanvasElement> = ref({} as HTMLCanvasElement)
  const gl: Ref<WebGL2RenderingContext> = ref({} as WebGL2RenderingContext)
  const pipelines: Ref<Record<string, Pipeline>> = ref({})

  let lastUsedPipeline: string | null = null

  const cameraMatrix = mat4.create()
  const viewMatrix = mat4.create()
  const projectionMatrix = mat4.create()
  const viewProjectionMatrix = mat4.create()

  //Light matrices for shadow mapping
  const lightViewMatrix = mat4.create()
  const lightProjectionMatrix = mat4.create()
  const lightViewProjectionMatrix = mat4.create()

  const viewDirectionMatrix = mat4.create()
  const viewDirectionProjectionMatrix = mat4.create()
  const viewDirectionProjectionInverseMatrix = mat4.create()

  const modelViewProjectionMatrix = mat4.create()
  const modelInverseMatrix = mat4.create()

  let fieldOfViewRadians: number
  let aspect = 16 / 9
  const zNear = 0.5
  const zFar = 100
  const depthTextureSize = 1024
  let depthTexture: Texture = null
  let depthFrameBuffer: FrameBuffer = null
  let useShadowMapPipeline = false

  function reset() {
    clearCanvas()
    lastUsedPipeline = null
    pipelines.value = {}
    gl.value = {} as WebGL2RenderingContext
    canvas.value = {} as HTMLCanvasElement
    mat4.identity(cameraMatrix)
    mat4.identity(viewMatrix)
    mat4.identity(projectionMatrix)
    mat4.identity(viewProjectionMatrix)
    mat4.identity(lightViewMatrix)
    mat4.identity(lightProjectionMatrix)
    mat4.identity(lightViewProjectionMatrix)
    mat4.identity(viewDirectionMatrix)
    mat4.identity(viewDirectionProjectionMatrix)
    mat4.identity(viewDirectionProjectionInverseMatrix)
    mat4.identity(modelViewProjectionMatrix)
    mat4.identity(modelInverseMatrix)
    fieldOfViewRadians = 0
    aspect = 16 / 9
    depthTexture = null
    depthFrameBuffer = null
    useShadowMapPipeline = false
  }

  function clearCanvas(color: vec4 = [0, 0, 0, 1]) {
    gl.value.clearColor(color[0], color[1], color[2], color[3])
    gl.value.enable(gl.value.CULL_FACE)
    gl.value.enable(gl.value.DEPTH_TEST)
    gl.value.clear(gl.value.COLOR_BUFFER_BIT | gl.value.DEPTH_BUFFER_BIT)
  }

  function initialize(canvasId: string) {
    canvas.value = document.getElementById(canvasId) as HTMLCanvasElement
    const glContext = canvas.value?.getContext('webgl2')

    if (!glContext) {
      throw 'Unable to initialize WebGL. Your browser or machine may not support it.'
    } else {
      gl.value = glContext

      pipelines.value.skybox = new SkyboxPipeline(gl.value)
      pipelines.value.light = new LightPipeline(gl.value)
      pipelines.value.shadow = new ShadowPipeline(gl.value)
      pipelines.value.quad = new QuadPipeline(gl.value)
      pipelines.value.default = new DefaultPipeline(gl.value)
      initializeShadowMap()
    }

    return true
  }

  function setFieldOfView(fieldOfViewDegrees: number) {
    fieldOfViewRadians = utils.degToRad(fieldOfViewDegrees)
    recalculateViewport()
  }

  function recalculateViewport() {
    gl.value.viewport(0, 0, canvas.value.width, canvas.value.height)
    aspect = canvas.value.clientWidth / canvas.value.clientHeight
    mat4.perspective(projectionMatrix, fieldOfViewRadians, aspect, zNear, zFar)
  }

  function resize() {
    const result = webgl.resizeCanvasToDisplaySize(canvas.value)
    gl.value.viewport(0, 0, canvas.value.width, canvas.value.height)
    if (result) {
      recalculateViewport()
    }
  }

  function initializeShadowMap() {
    depthTexture = gl.value.createTexture()
    gl.value.bindTexture(gl.value.TEXTURE_2D, depthTexture)

    gl.value.texStorage2D(gl.value.TEXTURE_2D, 1, gl.value.DEPTH_COMPONENT32F, depthTextureSize, depthTextureSize)
    gl.value.texParameteri(gl.value.TEXTURE_2D, gl.value.TEXTURE_MAG_FILTER, gl.value.NEAREST)
    gl.value.texParameteri(gl.value.TEXTURE_2D, gl.value.TEXTURE_MIN_FILTER, gl.value.NEAREST)
    gl.value.texParameteri(gl.value.TEXTURE_2D, gl.value.TEXTURE_WRAP_S, gl.value.CLAMP_TO_EDGE)
    gl.value.texParameteri(gl.value.TEXTURE_2D, gl.value.TEXTURE_WRAP_T, gl.value.CLAMP_TO_EDGE)

    depthFrameBuffer = gl.value.createFramebuffer()
    gl.value.bindFramebuffer(gl.value.FRAMEBUFFER, depthFrameBuffer)
    gl.value.framebufferTexture2D(gl.value.FRAMEBUFFER, gl.value.DEPTH_ATTACHMENT, gl.value.TEXTURE_2D, depthTexture, 0)

    if (gl.value.checkFramebufferStatus(gl.value.FRAMEBUFFER) !== gl.value.FRAMEBUFFER_COMPLETE) {
      console.error('Error setting up framebuffer')
    }

    // Unbind the framebuffer and the texture.
    gl.value.bindFramebuffer(gl.value.FRAMEBUFFER, null)
    gl.value.bindTexture(gl.value.TEXTURE_2D, null)
  }

  function renderShadowMapTexture(scene: Scene) {
    const pipeline = pipelines.value.quad
    const mesh = Primitives.createXYQuad()
    mesh.vaoMap.quad = pipeline.createMeshVAO(mesh, 2)
    const entity = new Entity(mesh.name, mesh)

    gl.value.bindVertexArray(mesh.vaoMap.quad)
    pipeline.setGlobalUniforms(scene)
    pipeline.render(scene, entity)
    lastUsedPipeline = 'quad'
  }

  function setRenderShadowMap(scene: Scene) {
    if (!scene.directionalLight) return

    const lightTransform = scene.directionalLight.transform
    mat4.lookAt(
      lightViewMatrix,
      lightTransform.position,
      vec3.add(vec3.create(), lightTransform.position, lightTransform.getFrontVector()),
      lightTransform.getUpVector()
    )
    mat4.ortho(lightProjectionMatrix, -10, 10, -10, 10, 0, 100)
    mat4.multiply(lightViewProjectionMatrix, lightProjectionMatrix, lightViewMatrix)
    gl.value.bindFramebuffer(gl.value.FRAMEBUFFER, depthFrameBuffer)
    gl.value.viewport(0, 0, depthTextureSize, depthTextureSize)
    gl.value.cullFace(gl.value.FRONT)
    gl.value.clear(gl.value.COLOR_BUFFER_BIT | gl.value.DEPTH_BUFFER_BIT)

    useShadowMapPipeline = true
    pipelines.value.shadow.setGlobalUniforms(scene)
  }

  function setRenderColor(scene: Scene) {
    useShadowMapPipeline = false
    gl.value.cullFace(gl.value.BACK)

    const cameraTransform = scene.camera.transform
    mat4.lookAt(
      viewMatrix,
      cameraTransform.position,
      vec3.add(vec3.create(), cameraTransform.position, cameraTransform.getFrontVector()),
      cameraTransform.getUpVector()
    )
    mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix)

    if (scene.skybox) {
      lastUsedPipeline = 'skybox'
      const pipeline = pipelines.value.skybox
      let vao = scene.skybox.mesh.vaoMap.skybox
      if (!scene.skybox.mesh.vaoMap.skybox) {
        vao = pipeline.createMeshVAO(scene.skybox.mesh, 3)
        scene.skybox.mesh.vaoMap.skybox = vao
      }

      gl.value.bindVertexArray(vao)
      pipeline.setGlobalUniforms(scene)
      pipeline.render(scene)
    }

    pipelines.value.light.setGlobalUniforms(scene)
    pipelines.value.default.setGlobalUniforms(scene)
  }

  function renderEntity(scene: Scene, entity: Entity) {
    // don't render lights with shadow map pipeline
    if (useShadowMapPipeline && entity.pipeline === 'light') return

    // get pipeline
    const pipelineKey = useShadowMapPipeline ? 'shadow' : entity.pipeline ?? scene.defaultPipeline
    const pipeline = pipelines.value[pipelineKey]
    let vao = entity.mesh.vaoMap[pipelineKey]

    // create vao if it doesn't exist
    if (!vao) {
      vao = pipeline.createMeshVAO(entity.mesh, 3)
      entity.mesh.vaoMap[pipelineKey] = vao
    }

    // set global uniforms if pipeline has changed
    if (lastUsedPipeline !== pipelineKey) {
      lastUsedPipeline = pipelineKey
      // pipeline.setGlobalUniforms(scene)
    }

    // render entity
    gl.value.bindVertexArray(vao)
    pipeline.render(scene, entity)
  }

  function getViewDirectionProjectionInverseMatrix() {
    mat4.copy(viewDirectionMatrix, viewMatrix)
    viewDirectionMatrix[12] = 0
    viewDirectionMatrix[13] = 0
    viewDirectionMatrix[14] = 0
    mat4.multiply(viewDirectionProjectionMatrix, projectionMatrix, viewDirectionMatrix)
    mat4.invert(viewDirectionProjectionInverseMatrix, viewDirectionProjectionMatrix)
    return viewDirectionProjectionInverseMatrix
  }

  function getModelInverseMatrix(entity: Entity) {
    mat4.transpose(modelInverseMatrix, mat4.invert(modelInverseMatrix, entity.transform.worldMatrix))
    return modelInverseMatrix
  }

  function getModelViewProjectionMatrix(entity: Entity) {
    mat4.multiply(modelViewProjectionMatrix, viewProjectionMatrix, entity.transform.worldMatrix)
    return modelViewProjectionMatrix
  }

  function getCameraMatrix() {
    return cameraMatrix
  }

  function getProjectionMatrix() {
    return projectionMatrix
  }

  function getViewMatrix() {
    return viewMatrix
  }

  function getViewProjectionMatrix() {
    return viewProjectionMatrix
  }

  function getLightProjectionMatrix() {
    return lightProjectionMatrix
  }

  function getLightViewMatrix() {
    return lightViewMatrix
  }

  function getLightViewProjectionMatrix() {
    return lightViewProjectionMatrix
  }

  function getShadowMap() {
    return depthTexture
  }

  function getDepthFrameBuffer() {
    return depthFrameBuffer
  }

  return {
    gl,
    canvas,
    pipelines,
    clearCanvas,
    initialize,
    resize,
    setFieldOfView,
    renderShadowMapTexture,
    setRenderShadowMap,
    setRenderColor,
    renderEntity,
    getCameraMatrix,
    getViewMatrix,
    getProjectionMatrix,
    getViewProjectionMatrix,
    getLightViewMatrix,
    getLightProjectionMatrix,
    getLightViewProjectionMatrix,
    getModelInverseMatrix,
    getModelViewProjectionMatrix,
    getViewDirectionProjectionInverseMatrix,
    getShadowMap,
    getDepthFrameBuffer,
    reset
  }
})
