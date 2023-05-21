import { ref, type Ref } from 'vue'
import { defineStore } from 'pinia'
import { mat4, quat, vec4 } from 'gl-matrix'
import { Entity } from '@/models/entity'
import { Scene } from '@/models/scene'
import webgl from '@/helpers/webgl'
import utils from '@/helpers/utils'
import type { Pipeline } from '@/models/pipeline'

export const useWebGLStore = defineStore('webgl', () => {
  const canvas: Ref<HTMLCanvasElement> = ref({} as HTMLCanvasElement)
  const gl: Ref<WebGL2RenderingContext> = ref({} as WebGL2RenderingContext)
  const pipelines: Ref<Record<string, Pipeline>> = ref({})

  let lastUsedVertexArray: WebGLVertexArrayObject | null = null

  const cameraQuaternion = quat.create()
  const cameraMatrix = mat4.create()
  const viewMatrix = mat4.create()
  const projectionMatrix = mat4.create()
  const viewProjectionMatrix = mat4.create()

  const viewDirectionMatrix = mat4.create()
  const viewDirectionProjectionMatrix = mat4.create()
  const viewDirectionProjectionInverseMatrix = mat4.create()

  // const modelMatrix = mat4.create()
  // const modelQuaternion = quat.create()
  const modelViewProjectionMatrix = mat4.create()
  const modelInverseMatrix = mat4.create()

  let fieldOfViewRadians: number
  let aspect = 16 / 9
  const zNear = 0.5
  const zFar = 100

  function clearCanvas(color: vec4 = [0, 0, 0, 1]) {
    gl.value.clearColor(color[0], color[1], color[2], color[3])
    gl.value.enable(gl.value.DEPTH_TEST)
    gl.value.enable(gl.value.CULL_FACE)
    gl.value.clear(gl.value.COLOR_BUFFER_BIT | gl.value.DEPTH_BUFFER_BIT)
  }

  function initialize(canvasId: string) {
    canvas.value = document.getElementById(canvasId) as HTMLCanvasElement
    const glContext = canvas.value?.getContext('webgl2')

    if (!glContext) {
      throw 'Unable to initialize WebGL. Your browser or machine may not support it.'
    } else {
      gl.value = glContext

      pipelines.value.default = webgl.createDefaultPipeline(gl.value)
      pipelines.value.skybox = webgl.createSkyboxPipeline(gl.value)
    }

    return true
  }

  const setFieldOfView = (fieldOfViewDegrees: number) => {
    fieldOfViewRadians = utils.degToRad(fieldOfViewDegrees)
    recalculateViewport()
  }

  const recalculateViewport = () => {
    gl.value.viewport(0, 0, canvas.value.width, canvas.value.height)
    aspect = canvas.value.clientWidth / canvas.value.clientHeight
    mat4.perspective(projectionMatrix, fieldOfViewRadians, aspect, zNear, zFar)
  }

  const resize = () => {
    const result = webgl.resizeCanvasToDisplaySize(canvas.value)
    if (result) {
      recalculateViewport()
    }
  }

  const setGlobalUniforms = (scene: Scene) => {
    quat.fromEuler(cameraQuaternion, scene.camera.rotation[0], scene.camera.rotation[1], scene.camera.rotation[2])
    mat4.fromRotationTranslation(cameraMatrix, cameraQuaternion, scene.camera.position)
    // const cameraPosition = vec3.fromValues(cameraMatrix[12], cameraMatrix[13], cameraMatrix[14])
    // mat4.targetTo(cameraMatrix, scene.camera.position, scene.camera.rotation, scene.camera.up)
    mat4.invert(viewMatrix, cameraMatrix)
    mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix)

    if (scene.skybox) {
      mat4.copy(viewDirectionMatrix, viewMatrix)
      viewDirectionMatrix[12] = 0
      viewDirectionMatrix[13] = 0
      viewDirectionMatrix[14] = 0
      mat4.multiply(viewDirectionProjectionMatrix, projectionMatrix, viewDirectionMatrix)
      mat4.invert(viewDirectionProjectionInverseMatrix, viewDirectionProjectionMatrix)

      // let our quad pass the depth test at 1.0
      gl.value.depthFunc(gl.value.LEQUAL)
      const pipeline = pipelines.value.skybox
      gl.value.useProgram(pipeline.program)
      gl.value.bindVertexArray(scene.skybox.mesh.vao)
      gl.value.uniformMatrix4fv(pipeline.uniforms.uViewDirectionProjectionInverse, false, viewDirectionProjectionInverseMatrix)
      gl.value.uniform1i(pipeline.uniforms.uSkybox, 0)

      gl.value.activeTexture(gl.value.TEXTURE0)
      gl.value.bindTexture(gl.value.TEXTURE_CUBE_MAP, scene.skybox.texture)
      gl.value.drawElements(gl.value.TRIANGLES, scene.skybox.mesh.indices.length, gl.value.UNSIGNED_SHORT, 0)
    }

    // Tell it to use our program (pair of shaders)
    const pipeline = pipelines.value.default
    gl.value.depthFunc(gl.value.LESS)
    gl.value.useProgram(pipeline.program)

    gl.value.uniformMatrix4fv(pipeline.uniforms.uCameraLoc, false, cameraMatrix)
    gl.value.uniform3fv(pipeline.uniforms.uLightDirectionLoc, scene.lightDirection)
    gl.value.uniform4fv(pipeline.uniforms.uLightColorLoc, scene.lightColor)
    gl.value.uniform4fv(pipeline.uniforms.uFogColorLocation, scene.fogColor)
    gl.value.uniform1f(pipeline.uniforms.uFogNearLocation, scene.fogNear)
    gl.value.uniform1f(pipeline.uniforms.uFogFarLocation, scene.fogFar)
  }

  const setEntityUniforms = (scene: Scene, entity: Entity) => {
    if (lastUsedVertexArray !== entity.mesh.vao) {
      lastUsedVertexArray = entity.mesh.vao
      gl.value.bindVertexArray(entity.mesh.vao)
    }

    // quat.fromEuler(modelQuaternion, entity.transform.worldRotation[0], entity.transform.worldRotation[1], entity.transform.worldRotation[2])
    // mat4.fromRotationTranslationScale(modelMatrix, modelQuaternion, entity.transform.worldPosition, entity.transform.worldScale)

    mat4.multiply(modelViewProjectionMatrix, viewProjectionMatrix, entity.transform.worldMatrix)
    mat4.transpose(modelInverseMatrix, mat4.invert(modelInverseMatrix, entity.transform.worldMatrix))

    gl.value.uniform4fv(pipelines.value.default.uniforms.uAlbedoLoc, entity.material.albedo)
    gl.value.uniform4fv(pipelines.value.default.uniforms.uSpecularLoc, entity.material.specular)
    gl.value.uniform1f(pipelines.value.default.uniforms.uRoughnessLoc, entity.material.roughness)
    gl.value.uniform1f(pipelines.value.default.uniforms.uSpecularFactorLoc, entity.material.specularFactor)
    // gl.value.uniform2fv(uniformLocations.uDiffuseLoc, uDiffuse)
    gl.value.uniformMatrix4fv(pipelines.value.default.uniforms.uModelLoc, false, entity.transform.worldMatrix)
    gl.value.uniformMatrix4fv(pipelines.value.default.uniforms.uModelInverseTransposeLoc, false, modelInverseMatrix)
    gl.value.uniformMatrix4fv(pipelines.value.default.uniforms.uModelViewProjectionLoc, false, modelViewProjectionMatrix)

    gl.value.activeTexture(gl.value.TEXTURE0)
    gl.value.bindTexture(gl.value.TEXTURE_2D, entity.material.diffuse)
  }

  const renderEntity = (scene: Scene, entity: Entity) => {
    setEntityUniforms(scene, entity)
    gl.value.drawElements(gl.value.TRIANGLES, entity.mesh.indices.length, gl.value.UNSIGNED_SHORT, 0)
  }

  return {
    gl,
    canvas,
    pipelines,
    clearCanvas,
    initialize,
    resize,
    setFieldOfView,
    setGlobalUniforms,
    setEntityUniforms,
    renderEntity
  }
})
