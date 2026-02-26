import { ref, type Ref } from 'vue'
import { defineStore } from 'pinia'
import { mat4, vec3, vec4 } from 'gl-matrix'
import { Entity } from '@/models/entity'
import { Scene } from '@/models/scene'
import webgl from '@/helpers/webgl'
import utils from '@/helpers/utils'
import {
  DefaultPipeline,
  SkyboxPipeline,
  type Pipeline,
  LightPipeline,
  ShadowPipeline,
  QuadPipeline,
  WireframePipeline,
  PostProcessPipeline,
  type RenderOptions,
  GeometryPipeline,
  SSAOPipeline,
  SSAOBlurPipeline
} from '@/models/pipeline'
import type { FrameBuffer, Texture } from '@/models/types'
import type { Mesh } from '@/models/mesh'
import type { Transform } from '@/models/transform'
import type { Material } from '@/models/material'
import { getLightSpaceMatrix, getCascadeSplits, CASCADE_COUNT, SHADOW_MAP_SIZE } from '@/helpers/shadows'

export const pipelineKeys = {
  skybox: 'skybox',
  light: 'light',
  shadow: 'shadow',
  quad: 'quad',
  default: 'default',
  wireframe: 'wireframe',
  postProcess: 'postProcess',
  geometry: 'geometry',
  ssao: 'ssao',
  ssaoBlur: 'ssaoBlur'
}

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

  const shadowMapSize = SHADOW_MAP_SIZE
  const cascadeCount = CASCADE_COUNT
  const cascadeSplits: Ref<number[]> = ref([])
  const lightSpaceMatrices: Ref<mat4[]> = ref([])

  let depthTexture: Texture = null
  let depthFrameBuffer: FrameBuffer = null

  let mainFrameBuffer: FrameBuffer = null
  let mainColorTexture: Texture = null
  let mainDepthTexture: Texture = null

  // SSAO / G-Buffer
  let gBuffer: FrameBuffer = null
  let gNormalTexture: Texture = null
  let ssaoColorBuffer: FrameBuffer = null
  let ssaoColorTexture: Texture = null
  let ssaoBlurBuffer: FrameBuffer = null
  let ssaoBlurTexture: Texture = null
  let ssaoNoiseTexture: Texture = null
  let ssaoKernel: vec3[] = []

  function reset() {
    if (gl.value && typeof gl.value.clearColor === 'function') {
      clearCanvas()
    }
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
    mainFrameBuffer = null
    mainColorTexture = null
    mainDepthTexture = null
    cascadeSplits.value = []
    lightSpaceMatrices.value = []

    gBuffer = null
    gNormalTexture = null
    ssaoColorBuffer = null
    ssaoColorTexture = null
    ssaoBlurBuffer = null
    ssaoBlurTexture = null
    ssaoNoiseTexture = null
    ssaoKernel = []
  }

  function clearCanvas(color: vec4 = [0, 0, 0, 1]) {
    gl.value.clearColor(color[0], color[1], color[2], color[3])
    gl.value.enable(gl.value.CULL_FACE)
    gl.value.enable(gl.value.DEPTH_TEST)
    gl.value.clear(gl.value.COLOR_BUFFER_BIT | gl.value.DEPTH_BUFFER_BIT)
  }

  function initialize(canvasEl: string | HTMLCanvasElement) {
    if (typeof canvasEl === 'string') {
      canvas.value = document.getElementById(canvasEl) as HTMLCanvasElement
    } else {
      canvas.value = canvasEl
    }

    const glContext = canvas.value?.getContext('webgl2')

    if (!glContext) {
      throw 'Unable to initialize WebGL. Your browser or machine may not support it.'
    } else {
      gl.value = glContext

      if (!gl.value.getExtension('EXT_color_buffer_float')) {
        console.error('SSAO requires EXT_color_buffer_float')
      }

      pipelines.value[pipelineKeys.skybox] = new SkyboxPipeline(gl.value)
      pipelines.value[pipelineKeys.light] = new LightPipeline(gl.value)
      pipelines.value[pipelineKeys.shadow] = new ShadowPipeline(gl.value)
      pipelines.value[pipelineKeys.quad] = new QuadPipeline(gl.value)
      pipelines.value[pipelineKeys.default] = new DefaultPipeline(gl.value)
      pipelines.value[pipelineKeys.wireframe] = new WireframePipeline(gl.value)
      pipelines.value[pipelineKeys.postProcess] = new PostProcessPipeline(gl.value)
      pipelines.value[pipelineKeys.geometry] = new GeometryPipeline(gl.value)
      pipelines.value[pipelineKeys.ssao] = new SSAOPipeline(gl.value)
      pipelines.value[pipelineKeys.ssaoBlur] = new SSAOBlurPipeline(gl.value)

      initializeShadowMap()
      initializeMainFrameBuffer()
      initializeSSAO()
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
      resizeMainFrameBuffer()
      resizeSSAO()
    }
  }

  function initializeShadowMap() {
    depthTexture = gl.value.createTexture()
    gl.value.bindTexture(gl.value.TEXTURE_2D_ARRAY, depthTexture)

    gl.value.texStorage3D(gl.value.TEXTURE_2D_ARRAY, 1, gl.value.DEPTH_COMPONENT32F, shadowMapSize, shadowMapSize, cascadeCount)
    gl.value.texParameteri(gl.value.TEXTURE_2D_ARRAY, gl.value.TEXTURE_MAG_FILTER, gl.value.NEAREST)
    gl.value.texParameteri(gl.value.TEXTURE_2D_ARRAY, gl.value.TEXTURE_MIN_FILTER, gl.value.NEAREST)
    gl.value.texParameteri(gl.value.TEXTURE_2D_ARRAY, gl.value.TEXTURE_WRAP_S, gl.value.CLAMP_TO_EDGE)
    gl.value.texParameteri(gl.value.TEXTURE_2D_ARRAY, gl.value.TEXTURE_WRAP_T, gl.value.CLAMP_TO_EDGE)

    depthFrameBuffer = gl.value.createFramebuffer()
    gl.value.bindFramebuffer(gl.value.FRAMEBUFFER, depthFrameBuffer)

    // Attach layer 0 to make framebuffer complete (check only)
    gl.value.framebufferTextureLayer(gl.value.FRAMEBUFFER, gl.value.DEPTH_ATTACHMENT, depthTexture, 0, 0)

    if (gl.value.checkFramebufferStatus(gl.value.FRAMEBUFFER) !== gl.value.FRAMEBUFFER_COMPLETE) {
      console.error('Error setting up framebuffer')
    }

    // Unbind the framebuffer and the texture.
    gl.value.bindFramebuffer(gl.value.FRAMEBUFFER, null)
    gl.value.bindTexture(gl.value.TEXTURE_2D_ARRAY, null)
  }

  function initializeMainFrameBuffer() {
    const width = canvas.value.width
    const height = canvas.value.height

    mainColorTexture = gl.value.createTexture()
    gl.value.bindTexture(gl.value.TEXTURE_2D, mainColorTexture)
    gl.value.texImage2D(gl.value.TEXTURE_2D, 0, gl.value.RGBA, width, height, 0, gl.value.RGBA, gl.value.UNSIGNED_BYTE, null)
    gl.value.texParameteri(gl.value.TEXTURE_2D, gl.value.TEXTURE_MIN_FILTER, gl.value.LINEAR)
    gl.value.texParameteri(gl.value.TEXTURE_2D, gl.value.TEXTURE_MAG_FILTER, gl.value.LINEAR)
    gl.value.texParameteri(gl.value.TEXTURE_2D, gl.value.TEXTURE_WRAP_S, gl.value.CLAMP_TO_EDGE)
    gl.value.texParameteri(gl.value.TEXTURE_2D, gl.value.TEXTURE_WRAP_T, gl.value.CLAMP_TO_EDGE)
    gl.value.bindTexture(gl.value.TEXTURE_2D, null)

    mainDepthTexture = gl.value.createTexture()
    gl.value.bindTexture(gl.value.TEXTURE_2D, mainDepthTexture)
    gl.value.texImage2D(
      gl.value.TEXTURE_2D,
      0,
      gl.value.DEPTH_COMPONENT24,
      width,
      height,
      0,
      gl.value.DEPTH_COMPONENT,
      gl.value.UNSIGNED_INT,
      null
    )
    gl.value.texParameteri(gl.value.TEXTURE_2D, gl.value.TEXTURE_MIN_FILTER, gl.value.NEAREST)
    gl.value.texParameteri(gl.value.TEXTURE_2D, gl.value.TEXTURE_MAG_FILTER, gl.value.NEAREST)
    gl.value.texParameteri(gl.value.TEXTURE_2D, gl.value.TEXTURE_WRAP_S, gl.value.CLAMP_TO_EDGE)
    gl.value.texParameteri(gl.value.TEXTURE_2D, gl.value.TEXTURE_WRAP_T, gl.value.CLAMP_TO_EDGE)
    gl.value.bindTexture(gl.value.TEXTURE_2D, null)

    mainFrameBuffer = gl.value.createFramebuffer()
    gl.value.bindFramebuffer(gl.value.FRAMEBUFFER, mainFrameBuffer)
    gl.value.framebufferTexture2D(gl.value.FRAMEBUFFER, gl.value.COLOR_ATTACHMENT0, gl.value.TEXTURE_2D, mainColorTexture, 0)
    gl.value.framebufferTexture2D(gl.value.FRAMEBUFFER, gl.value.DEPTH_ATTACHMENT, gl.value.TEXTURE_2D, mainDepthTexture, 0)

    if (gl.value.checkFramebufferStatus(gl.value.FRAMEBUFFER) !== gl.value.FRAMEBUFFER_COMPLETE) {
      console.error('Error setting up main framebuffer')
    }

    gl.value.bindFramebuffer(gl.value.FRAMEBUFFER, null)
  }

  function resizeMainFrameBuffer() {
    if (!mainColorTexture || !mainDepthTexture) return
    const width = canvas.value.width
    const height = canvas.value.height

    gl.value.bindTexture(gl.value.TEXTURE_2D, mainColorTexture)
    gl.value.texImage2D(gl.value.TEXTURE_2D, 0, gl.value.RGBA, width, height, 0, gl.value.RGBA, gl.value.UNSIGNED_BYTE, null)

    gl.value.bindTexture(gl.value.TEXTURE_2D, mainDepthTexture)
    gl.value.texImage2D(
      gl.value.TEXTURE_2D,
      0,
      gl.value.DEPTH_COMPONENT24,
      width,
      height,
      0,
      gl.value.DEPTH_COMPONENT,
      gl.value.UNSIGNED_INT,
      null
    )
  }

  function initializeSSAO() {
    const width = canvas.value.width
    const height = canvas.value.height

    // G-Buffer
    gNormalTexture = gl.value.createTexture()
    gl.value.bindTexture(gl.value.TEXTURE_2D, gNormalTexture)
    gl.value.texImage2D(gl.value.TEXTURE_2D, 0, gl.value.RGBA16F, width, height, 0, gl.value.RGBA, gl.value.FLOAT, null)
    gl.value.texParameteri(gl.value.TEXTURE_2D, gl.value.TEXTURE_MIN_FILTER, gl.value.NEAREST)
    gl.value.texParameteri(gl.value.TEXTURE_2D, gl.value.TEXTURE_MAG_FILTER, gl.value.NEAREST)
    gl.value.texParameteri(gl.value.TEXTURE_2D, gl.value.TEXTURE_WRAP_S, gl.value.CLAMP_TO_EDGE)
    gl.value.texParameteri(gl.value.TEXTURE_2D, gl.value.TEXTURE_WRAP_T, gl.value.CLAMP_TO_EDGE)

    gBuffer = gl.value.createFramebuffer()
    gl.value.bindFramebuffer(gl.value.FRAMEBUFFER, gBuffer)
    gl.value.framebufferTexture2D(gl.value.FRAMEBUFFER, gl.value.COLOR_ATTACHMENT0, gl.value.TEXTURE_2D, gNormalTexture, 0)
    // Reuse Main Depth Texture
    gl.value.framebufferTexture2D(gl.value.FRAMEBUFFER, gl.value.DEPTH_ATTACHMENT, gl.value.TEXTURE_2D, mainDepthTexture, 0)

    if (gl.value.checkFramebufferStatus(gl.value.FRAMEBUFFER) !== gl.value.FRAMEBUFFER_COMPLETE)
      console.error('GBuffer not complete')

    // SSAO Color Buffer
    ssaoColorTexture = gl.value.createTexture()
    gl.value.bindTexture(gl.value.TEXTURE_2D, ssaoColorTexture)
    gl.value.texImage2D(gl.value.TEXTURE_2D, 0, gl.value.R8, width, height, 0, gl.value.RED, gl.value.UNSIGNED_BYTE, null)
    gl.value.texParameteri(gl.value.TEXTURE_2D, gl.value.TEXTURE_MIN_FILTER, gl.value.NEAREST)
    gl.value.texParameteri(gl.value.TEXTURE_2D, gl.value.TEXTURE_MAG_FILTER, gl.value.NEAREST)
    gl.value.texParameteri(gl.value.TEXTURE_2D, gl.value.TEXTURE_WRAP_S, gl.value.CLAMP_TO_EDGE)
    gl.value.texParameteri(gl.value.TEXTURE_2D, gl.value.TEXTURE_WRAP_T, gl.value.CLAMP_TO_EDGE)

    ssaoColorBuffer = gl.value.createFramebuffer()
    gl.value.bindFramebuffer(gl.value.FRAMEBUFFER, ssaoColorBuffer)
    gl.value.framebufferTexture2D(gl.value.FRAMEBUFFER, gl.value.COLOR_ATTACHMENT0, gl.value.TEXTURE_2D, ssaoColorTexture, 0)

    if (gl.value.checkFramebufferStatus(gl.value.FRAMEBUFFER) !== gl.value.FRAMEBUFFER_COMPLETE)
      console.error('SSAO Color Buffer not complete')

    // SSAO Blur Buffer
    ssaoBlurTexture = gl.value.createTexture()
    gl.value.bindTexture(gl.value.TEXTURE_2D, ssaoBlurTexture)
    gl.value.texImage2D(gl.value.TEXTURE_2D, 0, gl.value.R8, width, height, 0, gl.value.RED, gl.value.UNSIGNED_BYTE, null)
    gl.value.texParameteri(gl.value.TEXTURE_2D, gl.value.TEXTURE_MIN_FILTER, gl.value.NEAREST)
    gl.value.texParameteri(gl.value.TEXTURE_2D, gl.value.TEXTURE_MAG_FILTER, gl.value.NEAREST)
    gl.value.texParameteri(gl.value.TEXTURE_2D, gl.value.TEXTURE_WRAP_S, gl.value.CLAMP_TO_EDGE)
    gl.value.texParameteri(gl.value.TEXTURE_2D, gl.value.TEXTURE_WRAP_T, gl.value.CLAMP_TO_EDGE)

    ssaoBlurBuffer = gl.value.createFramebuffer()
    gl.value.bindFramebuffer(gl.value.FRAMEBUFFER, ssaoBlurBuffer)
    gl.value.framebufferTexture2D(gl.value.FRAMEBUFFER, gl.value.COLOR_ATTACHMENT0, gl.value.TEXTURE_2D, ssaoBlurTexture, 0)

    if (gl.value.checkFramebufferStatus(gl.value.FRAMEBUFFER) !== gl.value.FRAMEBUFFER_COMPLETE)
      console.error('SSAO Blur Buffer not complete')

    gl.value.bindFramebuffer(gl.value.FRAMEBUFFER, null)

    generateSSAOKernel()
    generateSSAONoise()
  }

  function resizeSSAO() {
    if(!gNormalTexture) return
    const width = canvas.value.width
    const height = canvas.value.height

    gl.value.bindTexture(gl.value.TEXTURE_2D, gNormalTexture)
    gl.value.texImage2D(gl.value.TEXTURE_2D, 0, gl.value.RGBA16F, width, height, 0, gl.value.RGBA, gl.value.FLOAT, null)

    gl.value.bindTexture(gl.value.TEXTURE_2D, ssaoColorTexture)
    gl.value.texImage2D(gl.value.TEXTURE_2D, 0, gl.value.R8, width, height, 0, gl.value.RED, gl.value.UNSIGNED_BYTE, null)

    gl.value.bindTexture(gl.value.TEXTURE_2D, ssaoBlurTexture)
    gl.value.texImage2D(gl.value.TEXTURE_2D, 0, gl.value.R8, width, height, 0, gl.value.RED, gl.value.UNSIGNED_BYTE, null)
  }

  function generateSSAOKernel() {
    ssaoKernel = []
    for (let i = 0; i < 64; i++) {
      const sample = vec3.create()
      sample[0] = Math.random() * 2.0 - 1.0
      sample[1] = Math.random() * 2.0 - 1.0
      sample[2] = Math.random()
      vec3.normalize(sample, sample)
      vec3.scale(sample, sample, Math.random())

      let scale = i / 64.0
      scale = 0.1 + (scale * scale) * (1.0 - 0.1) // lerp(0.1, 1.0, scale*scale)
      vec3.scale(sample, sample, scale)
      ssaoKernel.push(sample)
    }
  }

  function generateSSAONoise() {
    const noise = new Float32Array(16 * 3) // 4x4 * 3
    for (let i = 0; i < 16; i++) {
      noise[i*3] = Math.random() * 2.0 - 1.0
      noise[i*3+1] = Math.random() * 2.0 - 1.0
      noise[i*3+2] = 0.0 // Rotate around Z-axis (tangent space)
    }

    ssaoNoiseTexture = gl.value.createTexture()
    gl.value.bindTexture(gl.value.TEXTURE_2D, ssaoNoiseTexture)
    gl.value.texImage2D(gl.value.TEXTURE_2D, 0, gl.value.RGB16F, 4, 4, 0, gl.value.RGB, gl.value.FLOAT, noise)
    gl.value.texParameteri(gl.value.TEXTURE_2D, gl.value.TEXTURE_MIN_FILTER, gl.value.NEAREST)
    gl.value.texParameteri(gl.value.TEXTURE_2D, gl.value.TEXTURE_MAG_FILTER, gl.value.NEAREST)
    gl.value.texParameteri(gl.value.TEXTURE_2D, gl.value.TEXTURE_WRAP_S, gl.value.REPEAT)
    gl.value.texParameteri(gl.value.TEXTURE_2D, gl.value.TEXTURE_WRAP_T, gl.value.REPEAT)
  }

  function prepareShadowCascade(scene: Scene, cascadeIndex: number) {
    if (!scene.directionalLight) return

    // Calculate splits once per frame (heuristic: index 0)
    if (cascadeIndex === 0) {
      cascadeSplits.value = getCascadeSplits(zNear, zFar, cascadeCount, 0.5)
      if (lightSpaceMatrices.value.length !== cascadeCount) {
        lightSpaceMatrices.value = new Array(cascadeCount).fill(null).map(() => mat4.create())
      }
    }

    const near = cascadeSplits.value[cascadeIndex]
    const far = cascadeSplits.value[cascadeIndex + 1]

    const lightDir = scene.directionalLight.transform.getForwardVector()

    const lightSpaceMatrix = getLightSpaceMatrix(viewMatrix, fieldOfViewRadians, aspect, near, far, lightDir)

    if (lightSpaceMatrix) {
      mat4.copy(lightSpaceMatrices.value[cascadeIndex], lightSpaceMatrix)
      mat4.copy(lightViewProjectionMatrix, lightSpaceMatrix)
    }

    gl.value.bindFramebuffer(gl.value.FRAMEBUFFER, depthFrameBuffer)
    gl.value.framebufferTextureLayer(gl.value.FRAMEBUFFER, gl.value.DEPTH_ATTACHMENT, depthTexture, 0, cascadeIndex)

    gl.value.viewport(0, 0, shadowMapSize, shadowMapSize)
    gl.value.cullFace(gl.value.FRONT)
    gl.value.enable(gl.value.POLYGON_OFFSET_FILL)
    gl.value.polygonOffset(0.5, 0.5)
    gl.value.clear(gl.value.DEPTH_BUFFER_BIT)

    pipelines.value.shadow.setGlobalUniforms(scene)
  }

  function setRenderColor(scene: Scene) {
    gl.value.disable(gl.value.POLYGON_OFFSET_FILL)
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
    pipelines.value.wireframe.setGlobalUniforms(scene)
    pipelines.value.default.setGlobalUniforms(scene)
    pipelines.value.postProcess.setGlobalUniforms(scene)
  }

  function renderMesh(scene: Scene, pipelineKey: string, mesh: Mesh, transform: Transform, material?: Material, options?: RenderOptions) {
    // get pipeline
    pipelineKey = pipelineKey ?? scene.defaultPipeline
    const pipeline = pipelines.value[pipelineKey]
    let vao = mesh.vaoMap[pipelineKey]

    // create vao if it doesn't exist
    if (!vao) {
      vao = pipeline.createMeshVAO(mesh, 3)
      mesh.vaoMap[pipelineKey] = vao
    }

    // set global uniforms if pipeline has changed
    if (lastUsedPipeline !== pipelineKey) {
      lastUsedPipeline = pipelineKey
    }

    // render entity
    gl.value.bindVertexArray(vao)
    pipeline.render(scene, mesh, transform, material, options)
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

  function getMainFrameBuffer() {
    return mainFrameBuffer
  }

  function getMainColorTexture() {
    return mainColorTexture
  }

  function getMainDepthTexture() {
    return mainDepthTexture
  }

  function getCascadeSplitsArray() {
    return cascadeSplits.value
  }

  function getLightSpaceMatrices() {
    return lightSpaceMatrices.value
  }

  function getCascadeCount() {
    return cascadeCount
  }

  function getNearPlane() {
    return zNear
  }

  function getFarPlane() {
    return zFar
  }

  function getGBuffer() {
    return gBuffer
  }

  function getGNormalTexture() {
    return gNormalTexture
  }

  function getSSAOColorBuffer() {
    return ssaoColorBuffer
  }

  function getSSAOColorTexture() {
    return ssaoColorTexture
  }

  function getSSAOBlurBuffer() {
    return ssaoBlurBuffer
  }

  function getSSAOBlurTexture() {
    return ssaoBlurTexture
  }

  function getSSAONoiseTexture() {
    return ssaoNoiseTexture
  }

  function getSSAOKernel() {
    return ssaoKernel
  }

  return {
    gl,
    canvas,
    pipelines,
    clearCanvas,
    initialize,
    resize,
    setFieldOfView,
    prepareShadowCascade,
    setRenderColor,
    renderMesh,
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
    getMainFrameBuffer,
    getMainColorTexture,
    getMainDepthTexture,
    getCascadeSplitsArray,
    getLightSpaceMatrices,
    getCascadeCount,
    getNearPlane,
    getFarPlane,
    getGBuffer,
    getGNormalTexture,
    getSSAOColorBuffer,
    getSSAOColorTexture,
    getSSAOBlurBuffer,
    getSSAOBlurTexture,
    getSSAONoiseTexture,
    getSSAOKernel,
    reset
  }
})
