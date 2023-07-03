import vertexShaderSource from '../shaders/vertex.shader'
import fragmentShaderSource from '../shaders/fragment.shader'
import skyboxVertexShaderSource from '../shaders/skyboxVertex.shader'
import skyboxFragmentShaderSource from '../shaders/skyboxFragment.shader'
import type { Pipeline } from '@/models/pipeline'

const compileShader = (gl: WebGL2RenderingContext, shaderSource: string, shaderType: number): WebGLShader => {
  const shader = gl.createShader(shaderType)
  if (!shader) {
    throw 'Error creating shader'
  }

  gl.shaderSource(shader, shaderSource)
  gl.compileShader(shader)

  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS)
  if (!success) {
    throw 'could not compile shader:' + gl.getShaderInfoLog(shader)
  }

  return shader
}

const createShadersFromScript = (gl: WebGL2RenderingContext, vertexShaderSource: string, fragmentShaderSource: string) => {
  if (!vertexShaderSource || !fragmentShaderSource) {
    throw '*** Error: at least one shader file not found'
  }

  const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER)
  const fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER)
  return { vertexShader, fragmentShader }
}

const createDefaultPipeline = (gl: WebGL2RenderingContext): Pipeline => {
  const { vertexShader, fragmentShader } = createShadersFromScript(gl, vertexShaderSource, fragmentShaderSource)
  const program = gl.createProgram()
  if (!program) {
    throw 'Error creating shader program'
  }

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  const success = gl.getProgramParameter(program, gl.LINK_STATUS)
  if (!success) {
    throw 'program failed to link:' + gl.getProgramInfoLog(program)
  }

  const pipeline: Pipeline = {
    program,
    attributes: {
      positionLoc: gl.getAttribLocation(program, 'aPosition'),
      normalLoc: gl.getAttribLocation(program, 'aNormal'),
      textureCoordsLoc: gl.getAttribLocation(program, 'aTextureCoords')
    },
    uniforms: {
      uLightDirectionLoc: gl.getUniformLocation(program, 'uLightDirection'),
      uLightColorLoc: gl.getUniformLocation(program, 'uLightColor'),
      uAlbedoLoc: gl.getUniformLocation(program, 'uAlbedo'),
      uSpecularLoc: gl.getUniformLocation(program, 'uSpecular'),
      uRoughnessLoc: gl.getUniformLocation(program, 'uRoughness'),
      uSpecularFactorLoc: gl.getUniformLocation(program, 'uSpecularFactor'),
      uDiffuseLoc: gl.getUniformLocation(program, 'uDiffuse'),
      uModelLoc: gl.getUniformLocation(program, 'uModel'),
      uModelInverseTransposeLoc: gl.getUniformLocation(program, 'uModelInverseTranspose'),
      uModelViewProjectionLoc: gl.getUniformLocation(program, 'uModelViewProjection'),
      uCameraLoc: gl.getUniformLocation(program, 'uCamera'),
      uFogColorLocation: gl.getUniformLocation(program, 'uFogColor'),
      uFogNearLocation: gl.getUniformLocation(program, 'uFogNear'),
      uFogFarLocation: gl.getUniformLocation(program, 'uFogFar')
    }
  }

  return pipeline
}

const createSkyboxPipeline = (gl: WebGL2RenderingContext): Pipeline => {
  const { vertexShader, fragmentShader } = createShadersFromScript(gl, skyboxVertexShaderSource, skyboxFragmentShaderSource)
  const program = gl.createProgram()
  if (!program) {
    throw 'Error creating shader program'
  }

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)

  const success = gl.getProgramParameter(program, gl.LINK_STATUS)
  if (!success) {
    throw 'program failed to link:' + gl.getProgramInfoLog(program)
  }

  const pipeline: Pipeline = {
    program,
    attributes: {
      aPosition: gl.getAttribLocation(program, 'aPosition')
    },
    uniforms: {
      uViewDirectionProjectionInverse: gl.getUniformLocation(program, 'uViewDirectionProjectionInverse'),
      uSkybox: gl.getUniformLocation(program, 'uSkybox')
    }
  }

  return pipeline
}

const resizeCanvasToDisplaySize = (canvas: HTMLCanvasElement) => {
  const width = canvas.clientWidth
  const height = canvas.clientHeight

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
    return true
  }

  return false
}

// // Create array buffer
// const buffer = new ArrayBuffer(16 * vertices.length)
// // Fill array buffer
// const dv = new DataView(buffer)
// vertices.forEach((vertex, i) => {
//   dv.setFloat32(16 * i, vertex.position[0], true)
//   dv.setFloat32(16 * i + 4, vertex.position[1], true)
//   dv.setFloat32(16 * i + 8, vertex.position[2], true)
//   dv.setInt8(16 * i + 12, vertex.normal[0] * 0x7f)
//   dv.setInt8(16 * i + 13, vertex.normal[1] * 0x7f)
//   dv.setInt8(16 * i + 14, vertex.normal[2] * 0x7f)
//   dv.setInt8(16 * i + 15, 0)
// })

export default { createDefaultPipeline, createSkyboxPipeline, resizeCanvasToDisplaySize }
