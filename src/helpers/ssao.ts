import { vec3 } from 'gl-matrix'

function lerp(a: number, b: number, f: number) {
  return a + f * (b - a)
}

export function generateSSAOKernel(size: number): Float32Array {
  const kernel = new Float32Array(size * 3)
  for (let i = 0; i < size; i++) {
    const sample = vec3.create()
    sample[0] = Math.random() * 2.0 - 1.0
    sample[1] = Math.random() * 2.0 - 1.0
    sample[2] = Math.random()
    vec3.normalize(sample, sample)

    let scale = i / size
    scale = lerp(0.1, 1.0, scale * scale)
    vec3.scale(sample, sample, scale)

    kernel[i * 3] = sample[0]
    kernel[i * 3 + 1] = sample[1]
    kernel[i * 3 + 2] = sample[2]
  }
  return kernel
}

export function generateNoiseTexture(gl: WebGL2RenderingContext): WebGLTexture | null {
  const noiseSize = 4
  const noise = new Float32Array(noiseSize * noiseSize * 3)
  for (let i = 0; i < noiseSize * noiseSize; i++) {
    noise[i * 3] = Math.random() * 2.0 - 1.0
    noise[i * 3 + 1] = Math.random() * 2.0 - 1.0
    noise[i * 3 + 2] = 0.0
  }

  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB16F, noiseSize, noiseSize, 0, gl.RGB, gl.FLOAT, noise)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
  gl.bindTexture(gl.TEXTURE_2D, null)

  return texture
}
