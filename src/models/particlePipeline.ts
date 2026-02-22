import particleVertexShaderSource from '../shaders/particle.vs'
import particleFragmentShaderSource from '../shaders/particle.fs'
import webgl from '@/helpers/webgl'
import type { Scene } from './scene'
import { useWebGLStore } from '@/stores/webgl'
import type { Mesh } from './mesh'
import type { Transform } from './transform'
import type { Material } from './material'
import type { Entity } from './entity'
import type { Pipeline, RenderOptions } from './pipeline'
import { ParticleSystem } from './particleSystem'

export class ParticlePipeline implements Pipeline {
  gl: WebGL2RenderingContext
  program: WebGLProgram
  attributes: Record<string, number>
  uniforms: Record<string, WebGLUniformLocation | null>
  store = useWebGLStore()

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl
    this.program = webgl.createProgram(gl, particleVertexShaderSource, particleFragmentShaderSource)
    this.attributes = this.createAttributes()
    this.uniforms = this.createUniforms()
  }

  private createAttributes() {
    return {
      aPosition: this.gl.getAttribLocation(this.program, 'aPosition'),
      // Instanced
      iPosition: this.gl.getAttribLocation(this.program, 'iPosition'), // loc 2
      iColor: this.gl.getAttribLocation(this.program, 'iColor'),       // loc 3
      iSize: this.gl.getAttribLocation(this.program, 'iSize')          // loc 4
    }
  }

  private createUniforms() {
    return {
      view: this.gl.getUniformLocation(this.program, 'view'),
      projection: this.gl.getUniformLocation(this.program, 'projection'),
      model: this.gl.getUniformLocation(this.program, 'model')
    }
  }

  public createMeshVAO(mesh: Mesh, numberOfComponents: number = 3) {
    // This creates the base VAO for the mesh geometry (Quad)
    // Instanced attributes are bound later in render() because they depend on the ParticleSystem component's buffer

    this.gl.useProgram(this.program)
    const vao = this.gl.createVertexArray()
    this.gl.bindVertexArray(vao)

    const positionBuffer = this.gl.createBuffer()
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(mesh.positions), this.gl.STATIC_DRAW)

    // aPosition
    this.gl.vertexAttribPointer(this.attributes.aPosition, numberOfComponents, this.gl.FLOAT, false, 0, 0)
    this.gl.enableVertexAttribArray(this.attributes.aPosition)

    const indicesBuffer = this.gl.createBuffer()
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indicesBuffer)
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indices), this.gl.STATIC_DRAW)

    this.gl.bindVertexArray(null)

    return vao
  }

  public setGlobalUniforms(scene: Scene): void {
    this.gl.useProgram(this.program)
    this.gl.uniformMatrix4fv(this.uniforms.view, false, this.store.getViewMatrix())
    this.gl.uniformMatrix4fv(this.uniforms.projection, false, this.store.getProjectionMatrix())
  }

  public render(scene: Scene, mesh?: Mesh, transform?: Transform, material?: Material, options?: RenderOptions, entity?: Entity): void {
    if (!entity || !mesh || !transform) return
    const particleSystem = entity.getComponent(ParticleSystem)
    if (!particleSystem || particleSystem.activeParticles === 0) return

    this.gl.useProgram(this.program)

    // Set Model Matrix
    this.gl.uniformMatrix4fv(this.uniforms.model, false, transform.worldMatrix)

    // Ensure Buffer exists
    if (!particleSystem.buffer) {
        particleSystem.buffer = this.gl.createBuffer()
        // Initialize with max size
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, particleSystem.buffer)
        this.gl.bufferData(this.gl.ARRAY_BUFFER, particleSystem.data.byteLength, this.gl.DYNAMIC_DRAW)
    }

    // Update Buffer Data (only active particles)
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, particleSystem.buffer)
    // Using a typed array view for just the active part
    const activeData = particleSystem.data.subarray(0, particleSystem.activeParticles * 13)
    this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, activeData)

    // Setup VAO with instance attributes if not already done
    // We cache the VAO in the ParticleSystem component to avoid re-binding attributes every frame
    // Note: The base VAO (mesh geometry) is created by createMeshVAO and stored in mesh.vaoMap
    // But since we need to bind the specific buffer of this ParticleSystem to the instance attributes,
    // we effectively modify the VAO state regarding these attributes.
    // If we use the shared VAO from mesh.vaoMap, we risk polluting it if multiple ParticleSystems share the mesh.
    // However, ParticleSystem creates a unique Mesh instance in constructor. So mesh.vaoMap is unique to this component.

    let vao = mesh.vaoMap['particle']
    if (!particleSystem.vao && vao) {
        this.gl.bindVertexArray(vao)
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, particleSystem.buffer)

        const stride = 13 * 4 // 52 bytes

        // iPosition (3 floats, offset 0)
        // Location 2 (from shader)
        // We use hardcoded locations from shader or query from program.
        // The shader uses layout(location=X), so query might return X.
        // attributes.iPosition should be correct.

        if (this.attributes.iPosition !== -1) {
            this.gl.enableVertexAttribArray(this.attributes.iPosition)
            this.gl.vertexAttribPointer(this.attributes.iPosition, 3, this.gl.FLOAT, false, stride, 0)
            this.gl.vertexAttribDivisor(this.attributes.iPosition, 1)
        }

        // iSize (1 float, offset 8*4 = 32)
        if (this.attributes.iSize !== -1) {
            this.gl.enableVertexAttribArray(this.attributes.iSize)
            this.gl.vertexAttribPointer(this.attributes.iSize, 1, this.gl.FLOAT, false, stride, 32)
            this.gl.vertexAttribDivisor(this.attributes.iSize, 1)
        }

        // iColor (4 floats, offset 9*4 = 36)
        if (this.attributes.iColor !== -1) {
            this.gl.enableVertexAttribArray(this.attributes.iColor)
            this.gl.vertexAttribPointer(this.attributes.iColor, 4, this.gl.FLOAT, false, stride, 36)
            this.gl.vertexAttribDivisor(this.attributes.iColor, 1)
        }

        particleSystem.vao = vao
        this.gl.bindVertexArray(null)
    }

    // Draw
    if (particleSystem.vao) {
        this.gl.bindVertexArray(particleSystem.vao)
        this.gl.drawElementsInstanced(this.gl.TRIANGLES, mesh.indices.length, this.gl.UNSIGNED_SHORT, 0, particleSystem.activeParticles)
        this.gl.bindVertexArray(null)
    }
  }
}
