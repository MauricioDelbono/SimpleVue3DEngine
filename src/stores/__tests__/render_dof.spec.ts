import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useRenderStore } from '../render'
import { useWebGLStore, pipelineKeys } from '../webgl'
import { Scene } from '@/models/scene'
import { Time } from '@/models/time'

// Mock WebGL2RenderingContext
const glMock = {
  createTexture: vi.fn(() => ({})),
  bindTexture: vi.fn(),
  texImage2D: vi.fn(),
  texParameteri: vi.fn(),
  createFramebuffer: vi.fn(() => ({})),
  bindFramebuffer: vi.fn(),
  framebufferTexture2D: vi.fn(),
  framebufferTextureLayer: vi.fn(),
  checkFramebufferStatus: vi.fn(() => 36053), // FRAMEBUFFER_COMPLETE
  createProgram: vi.fn(() => ({})),
  createShader: vi.fn(() => ({})),
  shaderSource: vi.fn(),
  compileShader: vi.fn(),
  getShaderParameter: vi.fn(() => true),
  attachShader: vi.fn(),
  linkProgram: vi.fn(),
  getProgramParameter: vi.fn(() => true),
  getShaderInfoLog: vi.fn(() => ''),
  getProgramInfoLog: vi.fn(() => ''),
  useProgram: vi.fn(),
  getAttribLocation: vi.fn(() => 0),
  getUniformLocation: vi.fn(() => ({})),
  createVertexArray: vi.fn(() => ({})),
  bindVertexArray: vi.fn(),
  createBuffer: vi.fn(() => ({})),
  bindBuffer: vi.fn(),
  bufferData: vi.fn(),
  vertexAttribPointer: vi.fn(),
  enableVertexAttribArray: vi.fn(),
  uniformMatrix4fv: vi.fn(),
  uniform1i: vi.fn(),
  uniform1f: vi.fn(),
  uniform3fv: vi.fn(),
  activeTexture: vi.fn(),
  drawElements: vi.fn(),
  viewport: vi.fn(),
  clearColor: vi.fn(),
  enable: vi.fn(),
  clear: vi.fn(),
  depthFunc: vi.fn(),
  texStorage3D: vi.fn(),
  cullFace: vi.fn(),
  polygonOffset: vi.fn(),
  disable: vi.fn(),
  // Constants
  FRAMEBUFFER: 0x8D40,
  FRAMEBUFFER_COMPLETE: 36053,
  COLOR_BUFFER_BIT: 0x00004000,
  DEPTH_BUFFER_BIT: 0x00000100,
  TEXTURE_2D: 0x0DE1,
  TEXTURE_2D_ARRAY: 0x8C1A,
  DEPTH_COMPONENT24: 0x81A6,
  DEPTH_COMPONENT: 0x1902,
  UNSIGNED_INT: 0x1405,
  UNSIGNED_BYTE: 0x1401,
  RGBA: 0x1908,
  NEAREST: 0x2600,
  LINEAR: 0x2601,
  CLAMP_TO_EDGE: 0x812F,
  TEXTURE_MIN_FILTER: 0x2801,
  TEXTURE_MAG_FILTER: 0x2800,
  TEXTURE_WRAP_S: 0x2802,
  TEXTURE_WRAP_T: 0x2803,
  DEPTH_ATTACHMENT: 0x8D00,
  COLOR_ATTACHMENT0: 0x8CE0,
  ARRAY_BUFFER: 0x8892,
  ELEMENT_ARRAY_BUFFER: 0x8893,
  STATIC_DRAW: 0x88E4,
  FLOAT: 0x1406,
  TRIANGLES: 0x0004,
  TEXTURE0: 0x84C0,
  TEXTURE1: 0x84C1,
  TEXTURE_CUBE_MAP: 0x8513,
  LEQUAL: 0x0203,
  LESS: 0x0201,
  ALWAYS: 0x0207,
  VERTEX_SHADER: 0x8B31,
  FRAGMENT_SHADER: 0x8B30,
  LINK_STATUS: 0x8B82,
  COMPILE_STATUS: 0x8B81
}

describe('Render Store - Depth of Field', () => {
  let canvasMock: HTMLCanvasElement

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()

    canvasMock = document.createElement('canvas')
    canvasMock.width = 800
    canvasMock.height = 600
    // Mock getContext
    vi.spyOn(canvasMock, 'getContext').mockReturnValue(glMock as unknown as WebGL2RenderingContext)
    // Mock client dimensions
    Object.defineProperty(canvasMock, 'clientWidth', { value: 800 })
    Object.defineProperty(canvasMock, 'clientHeight', { value: 600 })
  })

  it('should enable DoF and render post process pass', () => {
    const renderStore = useRenderStore()
    const webglStore = useWebGLStore()

    // Initialize WebGL
    renderStore.initialize(canvasMock)

    // Set up scene
    const scene = new Scene()
    scene.depthOfField.enabled = true
    scene.wireframe = false
    renderStore.scene = scene

    // Spy on renderMesh
    const renderMeshSpy = vi.spyOn(webglStore, 'renderMesh')

    // Trigger render
    renderStore.startRender()
    renderStore.render(new Time(0))

    // Verify main framebuffer binding
    expect(glMock.bindFramebuffer).toHaveBeenCalledWith(glMock.FRAMEBUFFER, expect.anything())

    // Verify post process render call
    expect(renderMeshSpy).toHaveBeenCalledWith(
      expect.any(Object), // scene
      pipelineKeys.postProcess,
      expect.any(Object), // postProcessMesh
      expect.any(Object), // postProcessTransform
      undefined
    )
  })

  it('should NOT render post process pass when disabled', () => {
    const renderStore = useRenderStore()
    const webglStore = useWebGLStore()

    // Initialize WebGL
    renderStore.initialize(canvasMock)

    // Set up scene
    const scene = new Scene()
    scene.depthOfField.enabled = false
    renderStore.scene = scene

    // Spy on renderMesh
    const renderMeshSpy = vi.spyOn(webglStore, 'renderMesh')

    // Trigger render
    renderStore.startRender()
    renderStore.render(new Time(0))

    // Verify post process render call is NOT made
    expect(renderMeshSpy).not.toHaveBeenCalledWith(
      expect.any(Object),
      pipelineKeys.postProcess,
      expect.any(Object),
      expect.any(Object),
      expect.anything()
    )
  })

  it('should NOT render post process pass when wireframe is enabled', () => {
    const renderStore = useRenderStore()
    const webglStore = useWebGLStore()

    // Initialize WebGL
    renderStore.initialize(canvasMock)

    // Set up scene
    const scene = new Scene()
    scene.depthOfField.enabled = true
    scene.wireframe = true
    renderStore.scene = scene

    // Spy on renderMesh
    const renderMeshSpy = vi.spyOn(webglStore, 'renderMesh')

    // Trigger render
    renderStore.startRender()
    renderStore.render(new Time(0))

    // Verify post process render call is NOT made
    expect(renderMeshSpy).not.toHaveBeenCalledWith(
      expect.any(Object),
      pipelineKeys.postProcess,
      expect.any(Object),
      expect.any(Object),
      expect.anything()
    )
  })
})
