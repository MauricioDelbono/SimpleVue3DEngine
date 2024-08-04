function compileShader(gl: WebGL2RenderingContext, shaderSource: string, shaderType: number): WebGLShader {
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

function createShadersFromScript(gl: WebGL2RenderingContext, vertexShaderSource: string, fragmentShaderSource: string) {
  if (!vertexShaderSource || !fragmentShaderSource) {
    throw '*** Error: at least one shader file not found'
  }

  const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER)
  const fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER)
  return { vertexShader, fragmentShader }
}

function createProgram(gl: WebGL2RenderingContext, vertexShaderSource: string, fragmentShaderSource: string): WebGLProgram {
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

  return program
}

function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement) {
  const width = canvas.clientWidth
  const height = canvas.clientHeight

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
    return true
  }

  return false
}

export default { createProgram, resizeCanvasToDisplaySize }
