import { useWebGLStore } from '@/stores/webgl'

export default class Textures {
  static async loadImage(sourcePath: string): Promise<HTMLImageElement> {
    const image = new Image()
    image.src = sourcePath
    return new Promise<HTMLImageElement>((resolve, reject) => {
      image.addEventListener('load', () => {
        resolve(image)
      })
      image.addEventListener('error', () => {
        reject(`Couldn't load image ${sourcePath}`)
      })
    })
  }

  static async loadImageIntoTexture(
    gl: WebGL2RenderingContext,
    texture: WebGLTexture,
    sourcePath: string,
    target: number,
    format: number
  ): Promise<void> {
    const image = await this.loadImage(sourcePath)
    gl.bindTexture(target, texture)
    gl.texImage2D(target, 0, format, gl.RGBA, gl.UNSIGNED_BYTE, image)
    gl.generateMipmap(target)
  }

  static async createTextureFromImage(sourcePath: string, SRGB: boolean = true): Promise<WebGLTexture> {
    const { gl } = useWebGLStore()
    const texture = gl.createTexture()
    if (!texture) {
      throw 'Error creating texture'
    }

    await this.loadImageIntoTexture(gl, texture, sourcePath, gl.TEXTURE_2D, SRGB ? gl.SRGB8_ALPHA8 : gl.RGBA)
    return texture
  }

  static createDefaultTexture(): WebGLTexture {
    const { gl } = useWebGLStore()
    const texture = gl.createTexture()
    if (!texture) {
      throw 'Error creating texture'
    }

    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.SRGB8_ALPHA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]))
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)

    return texture
  }

  static createTexture(): WebGLTexture {
    const { gl } = useWebGLStore()
    const texture = gl.createTexture()
    if (!texture) {
      throw 'Error creating texture'
    }

    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.SRGB,
      2,
      2,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([255, 255, 255, 255, 192, 192, 192, 255, 192, 192, 192, 255, 255, 255, 255, 255])
    )
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)

    return texture
  }

  static getCubeFaceOrder(gl: WebGL2RenderingContext): number[] {
    return [
      gl.TEXTURE_CUBE_MAP_POSITIVE_X,
      gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
      gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
      gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
      gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
      gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
    ]
  }

  static async createSkyBoxTexture(skyBoxSources: string[]): Promise<WebGLTexture> {
    const { gl } = useWebGLStore()
    const texture = gl.createTexture()
    if (!texture) {
      throw 'Error creating texture'
    }

    if (skyBoxSources.length !== 6) {
      throw 'Invalid number of skybox sources'
    }

    const images: HTMLImageElement[] = await Promise.all(skyBoxSources.map((sourcePath) => this.loadImage(sourcePath)))
    if (images.length === 6) {
      const cubeFaceOrder = this.getCubeFaceOrder(gl)
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture)
      images.forEach((image, index) => {
        gl.texImage2D(cubeFaceOrder[index], 0, gl.SRGB, gl.RGBA, gl.UNSIGNED_BYTE, image)
      })
      gl.generateMipmap(gl.TEXTURE_CUBE_MAP)
    }

    return texture
  }

  static async createSkyBoxTextureFromOneSource(skyBoxSource: string): Promise<WebGLTexture> {
    const { gl } = useWebGLStore()
    const texture = gl.createTexture()
    if (!texture) {
      throw 'Error creating texture'
    }

    const image: HTMLImageElement = await this.loadImage(skyBoxSource)
    if (image) {
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture)

      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      const size = image.width / 4 // assume it's a 4x3 texture
      // left, right, top, bottom, front, back
      const slices = [0, 1, 2, 1, 1, 0, 1, 2, 1, 1, 3, 1]
      const tempCtx = document.createElement('canvas').getContext('2d')
      if (!tempCtx) {
        throw 'Error creating canvas'
      }

      tempCtx.canvas.width = size
      tempCtx.canvas.height = size
      tempCtx.translate(size, 0)
      tempCtx.scale(-1, 1)
      const cubeFaceOrder = this.getCubeFaceOrder(gl)
      for (let index = 0; index < 6; ++index) {
        const xOffset = slices[index * 2 + 0] * size
        const yOffset = slices[index * 2 + 1] * size
        tempCtx.drawImage(image, xOffset, yOffset, size, size, 0, 0, size, size)
        gl.texImage2D(cubeFaceOrder[index], 0, gl.SRGB, gl.RGBA, gl.UNSIGNED_BYTE, tempCtx.canvas)
      }

      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
      gl.generateMipmap(gl.TEXTURE_CUBE_MAP)
      gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
      tempCtx.canvas.width = 1
      tempCtx.canvas.height = 1
    }

    return texture
  }
}
