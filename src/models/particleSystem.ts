import { Component, EditorProp, EditorPropType } from './component'
import { vec3 } from 'gl-matrix'
import type { Time } from './time'

export class ParticleSystem extends Component {
  public maxParticles: number = 1000
  public emissionRate: number = 100 // particles per second
  public lifetime: number = 5.0
  public speed: number = 5.0
  public startColor: vec3 = vec3.fromValues(1, 1, 1)
  public endColor: vec3 = vec3.fromValues(1, 0, 0)
  public startSize: number = 1.0
  public endSize: number = 0.0
  public gravity: vec3 = vec3.fromValues(0, -9.8, 0)

  // Data arrays
  public positions: Float32Array
  public velocities: Float32Array
  public colors: Float32Array
  public sizes: Float32Array
  public lifetimes: Float32Array
  public ages: Float32Array

  public count: number = 0
  private timeSinceLastEmission: number = 0

  public vao: WebGLVertexArrayObject | null = null
  public buffers: {
    position?: WebGLBuffer
    color?: WebGLBuffer
    size?: WebGLBuffer
  } = {}

  constructor(maxParticles: number = 10000) {
    super()
    this.maxParticles = maxParticles
    this.positions = new Float32Array(maxParticles * 3)
    this.velocities = new Float32Array(maxParticles * 3)
    this.colors = new Float32Array(maxParticles * 4)
    this.sizes = new Float32Array(maxParticles)
    this.lifetimes = new Float32Array(maxParticles)
    this.ages = new Float32Array(maxParticles)

    this.addEditorProp(new EditorProp('emissionRate', EditorPropType.number))
    this.addEditorProp(new EditorProp('lifetime', EditorPropType.number))
    this.addEditorProp(new EditorProp('speed', EditorPropType.number))
    this.addEditorProp(new EditorProp('startSize', EditorPropType.number))
    this.addEditorProp(new EditorProp('endSize', EditorPropType.number))
    this.addEditorProp(new EditorProp('startColor', EditorPropType.vec3))
    this.addEditorProp(new EditorProp('endColor', EditorPropType.vec3))
    this.addEditorProp(new EditorProp('gravity', EditorPropType.vec3))
  }

  public update(time: Time) {
    // Cap dt to avoid large steps on lag
    const dt = Math.min(time.deltaSeconds, 0.1)

    // Emission
    this.timeSinceLastEmission += dt
    const emissionInterval = 1.0 / this.emissionRate
    while (this.timeSinceLastEmission >= emissionInterval) {
      this.emit()
      this.timeSinceLastEmission -= emissionInterval
    }

    // Update particles
    let activeCount = 0
    for (let i = 0; i < this.count; i++) {
      this.ages[i] += dt
      if (this.ages[i] < this.lifetimes[i]) {
        // Alive

        // Physics update
        const idx3 = i * 3

        // Gravity
        this.velocities[idx3] += this.gravity[0] * dt
        this.velocities[idx3 + 1] += this.gravity[1] * dt
        this.velocities[idx3 + 2] += this.gravity[2] * dt

        this.positions[idx3] += this.velocities[idx3] * dt
        this.positions[idx3 + 1] += this.velocities[idx3 + 1] * dt
        this.positions[idx3 + 2] += this.velocities[idx3 + 2] * dt

        // Interpolate color and size
        const t = this.ages[i] / this.lifetimes[i]
        this.sizes[i] = this.startSize + (this.endSize - this.startSize) * t

        const idx4 = i * 4
        this.colors[idx4] = this.startColor[0] + (this.endColor[0] - this.startColor[0]) * t
        this.colors[idx4 + 1] = this.startColor[1] + (this.endColor[1] - this.startColor[1]) * t
        this.colors[idx4 + 2] = this.startColor[2] + (this.endColor[2] - this.startColor[2]) * t
        this.colors[idx4 + 3] = 1.0 - t // Fade out alpha

        // Compact array
        if (i !== activeCount) {
             this.copy(i, activeCount)
        }
        activeCount++
      }
    }
    this.count = activeCount
  }

  private emit() {
    if (this.count >= this.maxParticles) return

    const i = this.count
    const idx3 = i * 3
    const idx4 = i * 4

    // Reset particle
    this.positions[idx3] = 0 // relative to emitter
    this.positions[idx3+1] = 0
    this.positions[idx3+2] = 0

    // Random direction
    const theta = Math.random() * 2 * Math.PI
    const phi = Math.acos(2 * Math.random() - 1)
    const sinPhi = Math.sin(phi)
    const dirX = sinPhi * Math.cos(theta)
    const dirY = sinPhi * Math.sin(theta)
    const dirZ = Math.cos(phi)

    this.velocities[idx3] = dirX * this.speed
    this.velocities[idx3+1] = dirY * this.speed
    this.velocities[idx3+2] = dirZ * this.speed

    this.colors[idx4] = this.startColor[0]
    this.colors[idx4+1] = this.startColor[1]
    this.colors[idx4+2] = this.startColor[2]
    this.colors[idx4+3] = 1.0

    this.sizes[i] = this.startSize
    this.lifetimes[i] = this.lifetime
    this.ages[i] = 0

    this.count++
  }

  private copy(src: number, dst: number) {
      const s3 = src * 3, d3 = dst * 3
      this.positions[d3] = this.positions[s3]; this.positions[d3+1] = this.positions[s3+1]; this.positions[d3+2] = this.positions[s3+2]
      this.velocities[d3] = this.velocities[s3]; this.velocities[d3+1] = this.velocities[s3+1]; this.velocities[d3+2] = this.velocities[s3+2]

      const s4 = src * 4, d4 = dst * 4
      this.colors[d4] = this.colors[s4]; this.colors[d4+1] = this.colors[s4+1]; this.colors[d4+2] = this.colors[s4+2]; this.colors[d4+3] = this.colors[s4+3]

      this.sizes[dst] = this.sizes[src]
      this.lifetimes[dst] = this.lifetimes[src]
      this.ages[dst] = this.ages[src]
  }
}
