import { Component, EditorProp } from './component'
import { Mesh } from './mesh'
import Primitives from '@/helpers/primitives'
import type { Time } from './time'
import { vec3, vec4 } from 'gl-matrix'

export class ParticleSystem extends Component {
  public mesh: Mesh
  public maxParticles: number = 10000
  public activeParticles: number = 0

  // Interleaved data: [posX, posY, posZ, velX, velY, velZ, life, maxLife, size, r, g, b, a]
  public data: Float32Array
  public buffer: WebGLBuffer | null = null
  public vao: WebGLVertexArrayObject | null = null

  // Configuration
  public emissionRate: number = 50
  public lifetime: number = 2.0
  public speed: number = 2.0
  public startSize: number = 0.1
  public endSize: number = 0.0
  public startColor: vec4 = [1, 1, 1, 1]
  public endColor: vec4 = [1, 0, 0, 0]
  public gravity: vec3 = [0, 1, 0]
  public loop: boolean = true
  public playing: boolean = true

  // Emitter
  public emissionShape: 'sphere' | 'box' | 'cone' = 'sphere'
  public emissionRadius: number = 0.5
  public direction: vec3 = [0, 1, 0]
  public spread: number = 0.5 // 0 = no spread (exact direction), 1 = full random

  private emissionAccumulator: number = 0

  constructor(maxParticles: number = 10000) {
    super()
    this.maxParticles = maxParticles
    this.data = new Float32Array(this.maxParticles * 13)
    this.mesh = Primitives.createXYQuad()
    this.setupEditorProps()
  }

  private setupEditorProps() {
    this.addEditorProp(new EditorProp('emissionRate', 'number'))
    this.addEditorProp(new EditorProp('lifetime', 'number'))
    this.addEditorProp(new EditorProp('speed', 'number'))
    this.addEditorProp(new EditorProp('startSize', 'number'))
    this.addEditorProp(new EditorProp('endSize', 'number'))
    this.addEditorProp(new EditorProp('gravity', 'vec3'))
    this.addEditorProp(new EditorProp('loop', 'boolean'))
    this.addEditorProp(new EditorProp('playing', 'boolean'))

    this.addEditorProp(new EditorProp('startColor', 'vec3'))
    this.addEditorProp(new EditorProp('endColor', 'vec3'))

    this.addEditorProp(new EditorProp('emissionRadius', 'number'))
    this.addEditorProp(new EditorProp('spread', 'number'))
    this.addEditorProp(new EditorProp('direction', 'vec3'))
    this.addEditorProp(new EditorProp('emissionShape', 'string')) // Dropdown not supported yet?
  }

  public update(time: Time) {
    if (!this.playing) return

    const dt = time.deltaSeconds

    // Emit new particles
    if (this.loop || this.activeParticles < this.maxParticles) {
      this.emissionAccumulator += dt * this.emissionRate
      const numberToEmit = Math.floor(this.emissionAccumulator)
      this.emissionAccumulator -= numberToEmit

      for (let i = 0; i < numberToEmit; i++) {
        this.emit()
      }
    }

    // Update existing particles
    for (let i = 0; i < this.activeParticles; i++) {
      const offset = i * 13

      // Life
      this.data[offset + 6] += dt
      const age = this.data[offset + 6]
      const maxLife = this.data[offset + 7]

      if (age >= maxLife) {
        // Kill particle
        this.kill(i)
        i--
        continue
      }

      // Normalized life (0 to 1)
      const t = age / maxLife

      // Update Velocity (Gravity)
      this.data[offset + 3] += this.gravity[0] * dt
      this.data[offset + 4] += this.gravity[1] * dt
      this.data[offset + 5] += this.gravity[2] * dt

      // Update Position
      this.data[offset + 0] += this.data[offset + 3] * dt
      this.data[offset + 1] += this.data[offset + 4] * dt
      this.data[offset + 2] += this.data[offset + 5] * dt

      // Update Size (Lerp)
      this.data[offset + 8] = this.startSize + (this.endSize - this.startSize) * t

      // Update Color (Lerp)
      this.data[offset + 9] = this.startColor[0] + (this.endColor[0] - this.startColor[0]) * t
      this.data[offset + 10] = this.startColor[1] + (this.endColor[1] - this.startColor[1]) * t
      this.data[offset + 11] = this.startColor[2] + (this.endColor[2] - this.startColor[2]) * t
      this.data[offset + 12] = this.startColor[3] + (this.endColor[3] - this.startColor[3]) * t
    }
  }

  private emit() {
    if (this.activeParticles >= this.maxParticles) return

    const offset = this.activeParticles * 13

    // Position
    let px = 0, py = 0, pz = 0

    if (this.emissionShape === 'box') {
      px = (Math.random() - 0.5) * 2 * this.emissionRadius
      py = (Math.random() - 0.5) * 2 * this.emissionRadius
      pz = (Math.random() - 0.5) * 2 * this.emissionRadius
    } else if (this.emissionShape === 'cone') {
        const r = this.emissionRadius * Math.sqrt(Math.random())
        const theta = Math.random() * 2 * Math.PI
        px = r * Math.cos(theta)
        py = 0
        pz = r * Math.sin(theta)
    } else {
        // Sphere (default)
        // Uniform point in sphere
        const u = Math.random()
        const v = Math.random()
        const theta = 2 * Math.PI * u
        const phi = Math.acos(2 * v - 1)
        const r = this.emissionRadius * Math.cbrt(Math.random())
        px = r * Math.sin(phi) * Math.cos(theta)
        py = r * Math.sin(phi) * Math.sin(theta)
        pz = r * Math.cos(phi)
    }

    this.data[offset + 0] = px
    this.data[offset + 1] = py
    this.data[offset + 2] = pz

    // Velocity based on Direction and Spread
    // Base direction
    const dx = this.direction[0]
    const dy = this.direction[1]
    const dz = this.direction[2]

    // Random vector
    const rx = (Math.random() - 0.5)
    const ry = (Math.random() - 0.5)
    const rz = (Math.random() - 0.5)

    // Mix direction with random based on spread
    // Normalize direction first?
    const dLen = Math.sqrt(dx*dx + dy*dy + dz*dz) || 1
    const nx = dx / dLen
    const ny = dy / dLen
    const nz = dz / dLen

    let vx = nx + rx * this.spread
    let vy = ny + ry * this.spread
    let vz = nz + rz * this.spread

    const vLen = Math.sqrt(vx*vx + vy*vy + vz*vz) || 1
    vx /= vLen
    vy /= vLen
    vz /= vLen

    this.data[offset + 3] = vx * this.speed
    this.data[offset + 4] = vy * this.speed
    this.data[offset + 5] = vz * this.speed

    // Life
    this.data[offset + 6] = 0 // age
    this.data[offset + 7] = this.lifetime // maxLife

    // Size
    this.data[offset + 8] = this.startSize

    // Color
    this.data[offset + 9] = this.startColor[0]
    this.data[offset + 10] = this.startColor[1]
    this.data[offset + 11] = this.startColor[2]
    this.data[offset + 12] = this.startColor[3]

    this.activeParticles++
  }

  private kill(index: number) {
    if (this.activeParticles === 0) return

    this.activeParticles--

    // Swap with last active
    const lastOffset = this.activeParticles * 13
    const currentOffset = index * 13

    // Copy 13 floats
    for (let i = 0; i < 13; i++) {
      this.data[currentOffset + i] = this.data[lastOffset + i]
    }
  }

  public burst(count: number) {
    for(let i=0; i<count; i++) {
      this.emit()
    }
  }
}
