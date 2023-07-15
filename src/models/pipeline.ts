import vertexShaderSource from '../shaders/vertex.shader'
import fragmentShaderSource from '../shaders/fragment.shader'
import skyboxVertexShaderSource from '../shaders/skyboxVertex.shader'
import skyboxFragmentShaderSource from '../shaders/skyboxFragment.shader'
import HDRVertexShaderSource from '../shaders/HDRVertex.shader'
import HDRFragmentShaderSource from '../shaders/HDRFragment.shader'
import lightVertexShaderSource from '../shaders/lightVertex.shader'
import lightFragmentShaderSource from '../shaders/lightFragment.shader'
import webgl from '@/helpers/webgl'
import type { Entity } from './entity'
import type { Scene } from './scene'
import { useWebGLStore } from '@/stores/webgl'
import type { Mesh } from './mesh'

export interface Pipeline {
  program: WebGLProgram
  uniforms: Record<string, WebGLUniformLocation | null>
  attributes: Record<string, number>
  gl: WebGL2RenderingContext

  createMeshVAO(mesh: Mesh, numberOfComponents: number): WebGLVertexArrayObject | null
  setGlobalUniforms(scene: Scene): void
  render(scene: Scene, entity?: Entity): void
}

export class DefaultPipeline implements Pipeline {
  gl: WebGL2RenderingContext
  program: WebGLProgram
  attributes: Record<string, number>
  uniforms: Record<string, WebGLUniformLocation | null>
  store = useWebGLStore()

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl
    this.program = webgl.createProgram(gl, vertexShaderSource, fragmentShaderSource)
    this.attributes = this.createAttributes()
    this.uniforms = this.createUniforms()
  }

  private createAttributes() {
    return {
      positionLoc: this.gl.getAttribLocation(this.program, 'aPosition'),
      normalLoc: this.gl.getAttribLocation(this.program, 'aNormal'),
      textureCoordsLoc: this.gl.getAttribLocation(this.program, 'aTextureCoords')
    }
  }

  private createUniforms() {
    return {
      uLightDirectionLoc: this.gl.getUniformLocation(this.program, 'uLightDirection'),
      uLightColorLoc: this.gl.getUniformLocation(this.program, 'uLightColor'),
      uAlbedoLoc: this.gl.getUniformLocation(this.program, 'uAlbedo'),
      uSpecularLoc: this.gl.getUniformLocation(this.program, 'uSpecular'),
      uRoughnessLoc: this.gl.getUniformLocation(this.program, 'uRoughness'),
      uSpecularFactorLoc: this.gl.getUniformLocation(this.program, 'uSpecularFactor'),
      uDiffuseLoc: this.gl.getUniformLocation(this.program, 'uDiffuse'),
      uModelLoc: this.gl.getUniformLocation(this.program, 'uModel'),
      uModelInverseTransposeLoc: this.gl.getUniformLocation(this.program, 'uModelInverseTranspose'),
      uModelViewProjectionLoc: this.gl.getUniformLocation(this.program, 'uModelViewProjection'),
      uCameraLoc: this.gl.getUniformLocation(this.program, 'uCamera'),
      uFogColorLocation: this.gl.getUniformLocation(this.program, 'uFogColor'),
      uFogNearLocation: this.gl.getUniformLocation(this.program, 'uFogNear'),
      uFogFarLocation: this.gl.getUniformLocation(this.program, 'uFogFar')
    }
  }

  public createMeshVAO(mesh: Mesh, numberOfComponents: number = 3) {
    this.gl.useProgram(this.program)
    const vao = this.gl.createVertexArray()
    this.gl.bindVertexArray(vao)

    const positionBuffer = this.gl.createBuffer()
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(mesh.positions), this.gl.STATIC_DRAW)
    const normalBuffer = this.gl.createBuffer()
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normalBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(mesh.normals), this.gl.STATIC_DRAW)
    const textureCoordsBuffer = this.gl.createBuffer()
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, textureCoordsBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(mesh.textureCoords), this.gl.STATIC_DRAW)
    const indicesBuffer = this.gl.createBuffer()
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indicesBuffer)
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indices), this.gl.STATIC_DRAW)

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer)
    this.gl.vertexAttribPointer(this.attributes.positionLoc, numberOfComponents, this.gl.FLOAT, false, 0, 0)
    this.gl.enableVertexAttribArray(this.attributes.positionLoc)
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normalBuffer)
    this.gl.vertexAttribPointer(this.attributes.normalLoc, numberOfComponents, this.gl.FLOAT, false, 0, 0)
    this.gl.enableVertexAttribArray(this.attributes.normalLoc)
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, textureCoordsBuffer)
    this.gl.vertexAttribPointer(this.attributes.textureCoordsLoc, 2, this.gl.FLOAT, false, 0, 0)
    this.gl.enableVertexAttribArray(this.attributes.textureCoordsLoc)
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indicesBuffer)

    this.gl.bindVertexArray(null)

    return vao
  }

  public setGlobalUniforms(scene: Scene): void {
    this.gl.depthFunc(this.gl.LESS)
    this.gl.useProgram(this.program)

    this.gl.uniformMatrix4fv(this.uniforms.uCameraLoc, false, this.store.getCameraMatrix())
    this.gl.uniform3fv(this.uniforms.uLightDirectionLoc, scene.lightDirection)
    this.gl.uniform4fv(this.uniforms.uLightColorLoc, scene.lightColor)
    this.gl.uniform4fv(this.uniforms.uFogColorLocation, scene.fogColor)
    this.gl.uniform1f(this.uniforms.uFogNearLocation, scene.fogNear)
    this.gl.uniform1f(this.uniforms.uFogFarLocation, scene.fogFar)
  }

  public render(scene: Scene, entity: Entity): void {
    this.gl.uniform4fv(this.uniforms.uAlbedoLoc, entity.material.albedo)
    this.gl.uniform4fv(this.uniforms.uSpecularLoc, entity.material.specular)
    this.gl.uniform1f(this.uniforms.uRoughnessLoc, entity.material.roughness)
    this.gl.uniform1f(this.uniforms.uSpecularFactorLoc, entity.material.specularFactor)
    this.gl.uniformMatrix4fv(this.uniforms.uModelLoc, false, entity.transform.worldMatrix)
    this.gl.uniformMatrix4fv(this.uniforms.uModelInverseTransposeLoc, false, this.store.getModelInverseMatrix(entity))
    this.gl.uniformMatrix4fv(this.uniforms.uModelViewProjectionLoc, false, this.store.getModelViewProjectionMatrix(entity))

    this.gl.activeTexture(this.gl.TEXTURE0)
    this.gl.bindTexture(this.gl.TEXTURE_2D, entity.material.diffuse)
  }
}

export class SkyboxPipeline implements Pipeline {
  gl: WebGL2RenderingContext
  program: WebGLProgram
  attributes: Record<string, number>
  uniforms: Record<string, WebGLUniformLocation | null>
  store = useWebGLStore()

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl
    this.program = webgl.createProgram(gl, skyboxVertexShaderSource, skyboxFragmentShaderSource)
    this.attributes = this.createAttributes()
    this.uniforms = this.createUniforms()
  }

  private createAttributes() {
    return {
      aPosition: this.gl.getAttribLocation(this.program, 'aPosition')
    }
  }

  private createUniforms() {
    return {
      uViewDirectionProjectionInverse: this.gl.getUniformLocation(this.program, 'uViewDirectionProjectionInverse'),
      uSkybox: this.gl.getUniformLocation(this.program, 'uSkybox')
    }
  }

  public createMeshVAO(mesh: Mesh, numberOfComponents: number = 3) {
    return null
  }

  public setGlobalUniforms(scene: Scene): void {
    if (scene.skybox) {
      this.gl.depthFunc(this.gl.LEQUAL)
      this.gl.useProgram(this.program)
      this.gl.bindVertexArray(scene.skybox.mesh.vaoMap.skybox)
      this.gl.uniformMatrix4fv(this.uniforms.uViewDirectionProjectionInverse, false, this.store.getViewDirectionProjectionInverseMatrix())
      this.gl.uniform1i(this.uniforms.uSkybox, 0)
    }
  }

  public render(scene: Scene, entity?: Entity): void {
    if (scene.skybox) {
      this.gl.activeTexture(this.gl.TEXTURE0)
      this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, scene.skybox.texture)
      this.gl.drawElements(this.gl.TRIANGLES, scene.skybox.mesh.indices.length, this.gl.UNSIGNED_SHORT, 0)
    }
  }
}

export class LightPipeline implements Pipeline {
  gl: WebGL2RenderingContext
  program: WebGLProgram
  attributes: Record<string, number>
  uniforms: Record<string, WebGLUniformLocation | null>
  store = useWebGLStore()

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl
    this.program = webgl.createProgram(gl, lightVertexShaderSource, lightFragmentShaderSource)
    this.attributes = this.createAttributes()
    this.uniforms = this.createUniforms()
  }

  private createAttributes() {
    return {
      position: this.gl.getAttribLocation(this.program, 'aPosition')
    }
  }

  private createUniforms() {
    return {
      model: this.gl.getUniformLocation(this.program, 'model'),
      view: this.gl.getUniformLocation(this.program, 'view'),
      projection: this.gl.getUniformLocation(this.program, 'projection')
    }
  }

  public createMeshVAO(mesh: Mesh, numberOfComponents: number = 3) {
    this.gl.useProgram(this.program)
    const vao = this.gl.createVertexArray()
    this.gl.bindVertexArray(vao)

    const positionBuffer = this.gl.createBuffer()
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(mesh.positions), this.gl.STATIC_DRAW)
    const indicesBuffer = this.gl.createBuffer()
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indicesBuffer)
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indices), this.gl.STATIC_DRAW)

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer)
    this.gl.vertexAttribPointer(this.attributes.position, numberOfComponents, this.gl.FLOAT, false, 0, 0)
    this.gl.enableVertexAttribArray(this.attributes.position)

    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indicesBuffer)

    this.gl.bindVertexArray(null)

    return vao
  }

  public setGlobalUniforms(scene: Scene): void {
    this.gl.depthFunc(this.gl.LESS)
    this.gl.useProgram(this.program)
    this.gl.uniformMatrix4fv(this.uniforms.view, false, this.store.getViewMatrix())
    this.gl.uniformMatrix4fv(this.uniforms.projection, false, this.store.getProjectionMatrix())
  }

  public render(scene: Scene, entity: Entity): void {
    this.gl.uniformMatrix4fv(this.uniforms.model, false, entity.transform.worldMatrix)
  }
}

export class HDRPipeline implements Pipeline {
  gl: WebGL2RenderingContext
  program: WebGLProgram
  attributes: Record<string, number>
  uniforms: Record<string, WebGLUniformLocation | null>
  store = useWebGLStore()
  private maxPointLights = 4

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl
    this.program = webgl.createProgram(gl, HDRVertexShaderSource, HDRFragmentShaderSource)
    this.attributes = this.createAttributes()
    this.uniforms = this.createUniforms()
  }

  private createAttributes() {
    return {
      position: this.gl.getAttribLocation(this.program, 'aPosition'),
      normal: this.gl.getAttribLocation(this.program, 'aNormal'),
      texture: this.gl.getAttribLocation(this.program, 'aTexCoords')
    }
  }

  private createUniforms() {
    const uniformLocations: Record<string, WebGLUniformLocation | null> = {
      dirLightEnabled: this.gl.getUniformLocation(this.program, 'dirLight.enabled'),
      dirLightDirection: this.gl.getUniformLocation(this.program, 'dirLight.direction'),
      dirLightAmbient: this.gl.getUniformLocation(this.program, 'dirLight.ambient'),
      dirLightDiffuse: this.gl.getUniformLocation(this.program, 'dirLight.diffuse'),
      dirLightSpecular: this.gl.getUniformLocation(this.program, 'dirLight.specular'),

      spotLightEnabled: this.gl.getUniformLocation(this.program, 'spotLight.enabled'),
      spotLightPosition: this.gl.getUniformLocation(this.program, 'spotLight.position'),
      spotLightDirection: this.gl.getUniformLocation(this.program, 'spotLight.direction'),
      spotLightAmbient: this.gl.getUniformLocation(this.program, 'spotLight.ambient'),
      spotLightDiffuse: this.gl.getUniformLocation(this.program, 'spotLight.diffuse'),
      spotLightSpecular: this.gl.getUniformLocation(this.program, 'spotLight.specular'),
      spotLightConstant: this.gl.getUniformLocation(this.program, 'spotLight.constant'),
      spotLightLinear: this.gl.getUniformLocation(this.program, 'spotLight.linear'),
      spotLightQuadratic: this.gl.getUniformLocation(this.program, 'spotLight.quadratic'),
      spotLightCutOff: this.gl.getUniformLocation(this.program, 'spotLight.cutOff'),
      spotLightOuterCutOff: this.gl.getUniformLocation(this.program, 'spotLight.outerCutOff'),

      albedo: this.gl.getUniformLocation(this.program, 'material.albedo'),
      diffuse: this.gl.getUniformLocation(this.program, 'material.diffuse'),
      specular: this.gl.getUniformLocation(this.program, 'material.specular'),
      emission: this.gl.getUniformLocation(this.program, 'material.emission'),
      shininess: this.gl.getUniformLocation(this.program, 'material.shininess'),

      viewPosition: this.gl.getUniformLocation(this.program, 'viewPos'),
      model: this.gl.getUniformLocation(this.program, 'model'),
      view: this.gl.getUniformLocation(this.program, 'view'),
      projection: this.gl.getUniformLocation(this.program, 'projection')
    }

    for (let index = 0; index < this.maxPointLights; index++) {
      uniformLocations[`pointLights[${index}]Enabled`] = this.gl.getUniformLocation(this.program, `pointLights[${index}].enabled`)
      uniformLocations[`pointLights[${index}]Position`] = this.gl.getUniformLocation(this.program, `pointLights[${index}].position`)
      uniformLocations[`pointLights[${index}]Ambient`] = this.gl.getUniformLocation(this.program, `pointLights[${index}].ambient`)
      uniformLocations[`pointLights[${index}]Diffuse`] = this.gl.getUniformLocation(this.program, `pointLights[${index}].diffuse`)
      uniformLocations[`pointLights[${index}]Specular`] = this.gl.getUniformLocation(this.program, `pointLights[${index}].specular`)
      uniformLocations[`pointLights[${index}]Constant`] = this.gl.getUniformLocation(this.program, `pointLights[${index}].constant`)
      uniformLocations[`pointLights[${index}]Linear`] = this.gl.getUniformLocation(this.program, `pointLights[${index}].linear`)
      uniformLocations[`pointLights[${index}]Quadratic`] = this.gl.getUniformLocation(this.program, `pointLights[${index}].quadratic`)
    }

    return uniformLocations
  }

  public createMeshVAO(mesh: Mesh, numberOfComponents: number = 3) {
    this.gl.useProgram(this.program)
    const vao = this.gl.createVertexArray()
    this.gl.bindVertexArray(vao)

    const positionBuffer = this.gl.createBuffer()
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(mesh.positions), this.gl.STATIC_DRAW)
    const normalBuffer = this.gl.createBuffer()
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normalBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(mesh.normals), this.gl.STATIC_DRAW)
    const textureCoordsBuffer = this.gl.createBuffer()
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, textureCoordsBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(mesh.textureCoords), this.gl.STATIC_DRAW)
    const indicesBuffer = this.gl.createBuffer()
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indicesBuffer)
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indices), this.gl.STATIC_DRAW)

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer)
    this.gl.vertexAttribPointer(this.attributes.position, numberOfComponents, this.gl.FLOAT, false, 0, 0)
    this.gl.enableVertexAttribArray(this.attributes.position)
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normalBuffer)
    this.gl.vertexAttribPointer(this.attributes.normal, numberOfComponents, this.gl.FLOAT, false, 0, 0)
    this.gl.enableVertexAttribArray(this.attributes.normal)
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, textureCoordsBuffer)
    this.gl.vertexAttribPointer(this.attributes.texture, 2, this.gl.FLOAT, false, 0, 0)
    this.gl.enableVertexAttribArray(this.attributes.texture)
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indicesBuffer)

    this.gl.bindVertexArray(null)

    return vao
  }

  public setGlobalUniforms(scene: Scene): void {
    this.gl.depthFunc(this.gl.LESS)
    this.gl.useProgram(this.program)

    this.gl.uniformMatrix4fv(this.uniforms.view, false, this.store.getViewMatrix())
    this.gl.uniformMatrix4fv(this.uniforms.projection, false, this.store.getProjectionMatrix())
    this.gl.uniform3fv(this.uniforms.viewPosition, scene.camera.position)

    if (scene.directionalLight) {
      this.gl.uniform1i(this.uniforms.dirLightEnabled, 1)
      this.gl.uniform3fv(this.uniforms.dirLightDirection, scene.directionalLight.transform.getForwardVector())
      this.gl.uniform3fv(this.uniforms.dirLightAmbient, scene.directionalLight.ambient)
      this.gl.uniform3fv(this.uniforms.dirLightDiffuse, scene.directionalLight.diffuse)
      this.gl.uniform3fv(this.uniforms.dirLightSpecular, scene.directionalLight.specular)
    }

    if (scene.spotLight) {
      this.gl.uniform1i(this.uniforms.spotLightEnabled, 1)
      this.gl.uniform3fv(this.uniforms.spotLightDirection, scene.spotLight.transform.getForwardVector())
      this.gl.uniform3fv(this.uniforms.spotLightPosition, scene.spotLight.transform.worldPosition)
      this.gl.uniform3fv(this.uniforms.spotLightAmbient, scene.spotLight.ambient)
      this.gl.uniform3fv(this.uniforms.spotLightDiffuse, scene.spotLight.diffuse)
      this.gl.uniform3fv(this.uniforms.spotLightSpecular, scene.spotLight.specular)
      this.gl.uniform1f(this.uniforms.spotLightCutOff, scene.spotLight.cutOff)
      this.gl.uniform1f(this.uniforms.spotLightOuterCutOff, scene.spotLight.outerCutOff)
      this.gl.uniform1f(this.uniforms.spotLightConstant, scene.spotLight.lightAttenuation.constant)
      this.gl.uniform1f(this.uniforms.spotLightLinear, scene.spotLight.lightAttenuation.linear)
      this.gl.uniform1f(this.uniforms.spotLightQuadratic, scene.spotLight.lightAttenuation.quadratic)
    }

    for (let index = 0; index < this.maxPointLights; index++) {
      if (index >= this.maxPointLights) return
      if (scene.pointLights.length <= index) return
      else {
        const light = scene.pointLights[index]
        this.gl.uniform1i(this.uniforms[`pointLights[${index}]Enabled`], 1)
        this.gl.uniform3fv(this.uniforms[`pointLights[${index}]Position`], light.transform.worldPosition)
        this.gl.uniform3fv(this.uniforms[`pointLights[${index}]Ambient`], light.ambient)
        this.gl.uniform3fv(this.uniforms[`pointLights[${index}]Diffuse`], light.diffuse)
        this.gl.uniform3fv(this.uniforms[`pointLights[${index}]Specular`], light.specular)
        this.gl.uniform1f(this.uniforms[`pointLights[${index}]Constant`], light.lightAttenuation.constant)
        this.gl.uniform1f(this.uniforms[`pointLights[${index}]Linear`], light.lightAttenuation.linear)
        this.gl.uniform1f(this.uniforms[`pointLights[${index}]Quadratic`], light.lightAttenuation.quadratic)
      }
    }
  }

  public render(scene: Scene, entity: Entity): void {
    this.gl.uniform3fv(this.uniforms.albedo, entity.hdrMaterial.albedo)
    this.gl.uniform1i(this.uniforms.diffuse, 0)
    this.gl.uniform1i(this.uniforms.specular, 1)
    this.gl.uniform1i(this.uniforms.emission, 2)
    this.gl.uniform1f(this.uniforms.shininess, entity.hdrMaterial.shininess)
    this.gl.uniformMatrix4fv(this.uniforms.model, false, entity.transform.worldMatrix)

    this.gl.activeTexture(this.gl.TEXTURE0)
    this.gl.bindTexture(this.gl.TEXTURE_2D, entity.hdrMaterial.diffuse)

    this.gl.activeTexture(this.gl.TEXTURE1)
    this.gl.bindTexture(this.gl.TEXTURE_2D, entity.hdrMaterial.specular)

    this.gl.activeTexture(this.gl.TEXTURE2)
    this.gl.bindTexture(this.gl.TEXTURE_2D, entity.hdrMaterial.emission)
  }
}
