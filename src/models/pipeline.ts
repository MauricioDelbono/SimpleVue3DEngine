import skyboxVertexShaderSource from '../shaders/skybox.vs'
import skyboxFragmentShaderSource from '../shaders/skybox.fs'
import defaultVertexShaderSource from '../shaders/default.vs'
import defaultFragmentShaderSource from '../shaders/default.fs'
import lightVertexShaderSource from '../shaders/light.vs'
import lightFragmentShaderSource from '../shaders/light.fs'
import shadowVertexShaderSource from '../shaders/shadow.vs'
import shadowFragmentShaderSource from '../shaders/shadow.fs'
import quadVertexShaderSource from '../shaders/quad.vs'
import quadFragmentShaderSource from '../shaders/quad.fs'
import wireframeVertexShaderSource from '../shaders/wireframe.vs'
import wireframeFragmentShaderSource from '../shaders/wireframe.fs'
import webgl from '@/helpers/webgl'
import type { Scene } from './scene'
import { useWebGLStore } from '@/stores/webgl'
import type { Mesh } from './mesh'
import type { Transform } from './transform'
import type { Material } from './material'

export interface Pipeline {
  program: WebGLProgram
  uniforms: Record<string, WebGLUniformLocation | null>
  attributes: Record<string, number>
  gl: WebGL2RenderingContext

  createMeshVAO(mesh: Mesh, numberOfComponents: number): WebGLVertexArrayObject | null
  setGlobalUniforms(scene: Scene): void
  render(scene: Scene, mesh?: Mesh, transform?: Transform, material?: Material): void
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

  public createMeshVAO(mesh: Mesh, numberOfComponents: number = 2) {
    this.gl.useProgram(this.program)
    const vao = this.gl.createVertexArray()
    this.gl.bindVertexArray(vao)

    const positionBuffer = this.gl.createBuffer()
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(mesh.positions), this.gl.STATIC_DRAW)
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer)
    this.gl.vertexAttribPointer(this.attributes.aPosition, 2, this.gl.FLOAT, false, 0, 0)
    this.gl.enableVertexAttribArray(this.attributes.aPosition)
    const indicesBuffer = this.gl.createBuffer()
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indicesBuffer)
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indices), this.gl.STATIC_DRAW)
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indicesBuffer)
    this.gl.bindVertexArray(null)

    return vao
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

  public render(scene: Scene, mesh?: Mesh, transform?: Transform, material?: Material): void {
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

  public render(scene: Scene, mesh: Mesh, transform: Transform, material?: Material): void {
    this.gl.depthFunc(this.gl.LESS)
    this.gl.useProgram(this.program)
    this.gl.uniformMatrix4fv(this.uniforms.model, false, transform.worldMatrix)

    this.gl.drawElements(this.gl.TRIANGLES, mesh.indices.length, this.gl.UNSIGNED_SHORT, 0)
  }
}

export class WireframePipeline implements Pipeline {
  gl: WebGL2RenderingContext
  program: WebGLProgram
  attributes: Record<string, number>
  uniforms: Record<string, WebGLUniformLocation | null>
  store = useWebGLStore()

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl
    this.program = webgl.createProgram(gl, wireframeVertexShaderSource, wireframeFragmentShaderSource)
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

  public render(scene: Scene, mesh: Mesh, transform: Transform, material?: Material): void {
    this.gl.depthFunc(this.gl.LESS)
    this.gl.useProgram(this.program)
    this.gl.uniformMatrix4fv(this.uniforms.model, false, transform.worldMatrix)

    this.gl.drawElements(this.gl.LINE_LOOP, mesh.indices.length, this.gl.UNSIGNED_SHORT, 0)
  }
}

export class ShadowPipeline implements Pipeline {
  gl: WebGL2RenderingContext
  program: WebGLProgram
  attributes: Record<string, number>
  uniforms: Record<string, WebGLUniformLocation | null>
  store = useWebGLStore()

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl
    this.program = webgl.createProgram(gl, shadowVertexShaderSource, shadowFragmentShaderSource)
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
      viewProjection: this.gl.getUniformLocation(this.program, 'viewProjection')
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
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.store.getDepthFrameBuffer())
    this.gl.uniformMatrix4fv(this.uniforms.viewProjection, false, this.store.getLightViewProjectionMatrix())
  }

  public render(scene: Scene, mesh: Mesh, transform: Transform, material?: Material): void {
    this.gl.depthFunc(this.gl.LESS)
    this.gl.useProgram(this.program)
    this.gl.uniformMatrix4fv(this.uniforms.model, false, transform.worldMatrix)

    this.gl.drawElements(this.gl.TRIANGLES, mesh.indices.length, this.gl.UNSIGNED_SHORT, 0)
  }
}

export class QuadPipeline implements Pipeline {
  gl: WebGL2RenderingContext
  program: WebGLProgram
  attributes: Record<string, number>
  uniforms: Record<string, WebGLUniformLocation | null>
  store = useWebGLStore()

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl
    this.program = webgl.createProgram(gl, quadVertexShaderSource, quadFragmentShaderSource)
    this.attributes = this.createAttributes()
    this.uniforms = this.createUniforms()
  }

  private createAttributes() {
    return {
      position: this.gl.getAttribLocation(this.program, 'aPosition'),
      textureCoords: this.gl.getAttribLocation(this.program, 'aTextureCoords')
    }
  }

  private createUniforms() {
    return {
      shadowMap: this.gl.getUniformLocation(this.program, 'shadowMap'),
      nearPlane: this.gl.getUniformLocation(this.program, 'nearPlane'),
      farPlane: this.gl.getUniformLocation(this.program, 'farPlane')
    }
  }

  public createMeshVAO(mesh: Mesh, numberOfComponents: number = 2) {
    this.gl.useProgram(this.program)
    const vao = this.gl.createVertexArray()
    this.gl.bindVertexArray(vao)

    const positionBuffer = this.gl.createBuffer()
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(mesh.positions), this.gl.STATIC_DRAW)
    const textureCoordsBuffer = this.gl.createBuffer()
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, textureCoordsBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(mesh.textureCoords), this.gl.STATIC_DRAW)
    const indicesBuffer = this.gl.createBuffer()
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indicesBuffer)
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indices), this.gl.STATIC_DRAW)

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer)
    this.gl.vertexAttribPointer(this.attributes.position, numberOfComponents, this.gl.FLOAT, false, 0, 0)
    this.gl.enableVertexAttribArray(this.attributes.position)
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, textureCoordsBuffer)
    this.gl.vertexAttribPointer(this.attributes.texture, 2, this.gl.FLOAT, false, 0, 0)
    this.gl.enableVertexAttribArray(this.attributes.texture)
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indicesBuffer)

    this.gl.bindVertexArray(null)

    return vao
  }

  public setGlobalUniforms(scene: Scene): void {
    this.gl.depthFunc(this.gl.ALWAYS)
    this.gl.useProgram(this.program)
    this.gl.uniform1f(this.uniforms.nearPlane, 0)
    this.gl.uniform1f(this.uniforms.farPlane, 100)
    this.gl.uniform1i(this.uniforms.shadowMap, 0)
    this.gl.activeTexture(this.gl.TEXTURE0)
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.store.getShadowMap())
  }

  public render(scene: Scene, mesh: Mesh, transform?: Transform, material?: Material): void {
    this.gl.drawElements(this.gl.TRIANGLES, mesh.indices.length, this.gl.UNSIGNED_SHORT, 0)
  }
}

export class DefaultPipeline implements Pipeline {
  gl: WebGL2RenderingContext
  program: WebGLProgram
  attributes: Record<string, number>
  uniforms: Record<string, WebGLUniformLocation | null>
  store = useWebGLStore()
  private maxPointLights = 4

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl
    this.program = webgl.createProgram(gl, defaultVertexShaderSource, defaultFragmentShaderSource)
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
      spotLightCutOff: this.gl.getUniformLocation(this.program, 'spotLight.cutOff'),
      spotLightOuterCutOff: this.gl.getUniformLocation(this.program, 'spotLight.outerCutOff'),

      color: this.gl.getUniformLocation(this.program, 'material.color'),
      diffuse: this.gl.getUniformLocation(this.program, 'material.diffuse'),
      specular: this.gl.getUniformLocation(this.program, 'material.specular'),
      emission: this.gl.getUniformLocation(this.program, 'material.emission'),
      shininess: this.gl.getUniformLocation(this.program, 'material.shininess'),

      viewPosition: this.gl.getUniformLocation(this.program, 'viewPos'),
      model: this.gl.getUniformLocation(this.program, 'model'),
      view: this.gl.getUniformLocation(this.program, 'view'),
      projection: this.gl.getUniformLocation(this.program, 'projection'),
      lightViewProjectionMatrix: this.gl.getUniformLocation(this.program, 'lightViewProjectionMatrix'),
      shadowMap: this.gl.getUniformLocation(this.program, 'shadowMap')
    }

    for (let index = 0; index < this.maxPointLights; index++) {
      uniformLocations[`pointLights[${index}]Enabled`] = this.gl.getUniformLocation(this.program, `pointLights[${index}].enabled`)
      uniformLocations[`pointLights[${index}]Position`] = this.gl.getUniformLocation(this.program, `pointLights[${index}].position`)
      uniformLocations[`pointLights[${index}]Ambient`] = this.gl.getUniformLocation(this.program, `pointLights[${index}].ambient`)
      uniformLocations[`pointLights[${index}]Diffuse`] = this.gl.getUniformLocation(this.program, `pointLights[${index}].diffuse`)
      uniformLocations[`pointLights[${index}]Specular`] = this.gl.getUniformLocation(this.program, `pointLights[${index}].specular`)
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
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null)
    this.gl.activeTexture(this.gl.TEXTURE0)
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.store.getShadowMap())
    this.gl.useProgram(this.program)

    this.gl.uniformMatrix4fv(this.uniforms.view, false, this.store.getViewMatrix())
    this.gl.uniformMatrix4fv(this.uniforms.projection, false, this.store.getProjectionMatrix())
    this.gl.uniform3fv(this.uniforms.viewPosition, scene.camera.transform.position)
    this.gl.uniformMatrix4fv(this.uniforms.lightViewProjectionMatrix, false, this.store.getLightViewProjectionMatrix())

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
      }
    }

    this.gl.uniform1i(this.uniforms.shadowMap, 0)
    // this.gl.activeTexture(this.gl.TEXTURE0)
    // this.gl.bindTexture(this.gl.TEXTURE_2D, this.store.getShadowMap())
  }

  public render(scene: Scene, mesh: Mesh, transform: Transform, material: Material): void {
    this.gl.depthFunc(this.gl.LESS)
    this.gl.useProgram(this.program)
    this.gl.uniform3fv(this.uniforms.color, material.color)
    this.gl.uniform1i(this.uniforms.diffuse, 1)
    this.gl.uniform1i(this.uniforms.specular, 2)
    this.gl.uniform1i(this.uniforms.emission, 3)
    this.gl.uniform1f(this.uniforms.shininess, material.shininess)
    this.gl.uniformMatrix4fv(this.uniforms.model, false, transform.worldMatrix)

    this.gl.activeTexture(this.gl.TEXTURE1)
    this.gl.bindTexture(this.gl.TEXTURE_2D, material.diffuse)

    this.gl.activeTexture(this.gl.TEXTURE2)
    this.gl.bindTexture(this.gl.TEXTURE_2D, material.specular)

    this.gl.activeTexture(this.gl.TEXTURE3)
    this.gl.bindTexture(this.gl.TEXTURE_2D, material.emission)

    this.gl.drawElements(this.gl.TRIANGLES, mesh.indices.length, this.gl.UNSIGNED_SHORT, 0)
  }
}
