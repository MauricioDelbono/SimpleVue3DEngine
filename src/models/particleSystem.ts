import { Component, EditorProp, EditorPropType } from './component'
import type { Time } from './time'
import { vec3, vec4 } from 'gl-matrix'
import type { Texture } from './types'

export interface ParticleConfig {
  maxParticles: number
  emissionRate: number
  lifetime: number
  speed: number
  size: number
  color: vec4
  loop: boolean
  duration: number
  emissionShape: 'sphere' | 'cone' | 'box'
  spread: number
  texture?: Texture
}

export class ParticleSystem extends Component {
  public config: ParticleConfig
  public particles: Float32Array
  public activeParticles: number = 0
  public isPlaying: boolean = true

  private emissionAccumulator: number = 0
  private timeElapsed: number = 0

  public static readonly STRIDE = 13

  constructor(config?: Partial<ParticleConfig>) {
    super()
    this.config = {
      maxParticles: 1000,
      emissionRate: 10,
      lifetime: 5,
      speed: 1,
      size: 0.1,
      color: [1, 1, 1, 1],
      loop: true,
      duration: 5,
      emissionShape: 'sphere',
      spread: 0,
      ...config
    }

    this.particles = new Float32Array(this.config.maxParticles * ParticleSystem.STRIDE)

    this.setupEditorProps()
  }

  private setupEditorProps() {
    this.addEditorProp(new EditorProp('maxParticles', EditorPropType.number))
    this.addEditorProp(new EditorProp('emissionRate', EditorPropType.number))
    this.addEditorProp(new EditorProp('lifetime', EditorPropType.number))
    this.addEditorProp(new EditorProp('speed', EditorPropType.number))
    this.addEditorProp(new EditorProp('size', EditorPropType.number))
    this.addEditorProp(new EditorProp('color', EditorPropType.vec3))
    this.addEditorProp(new EditorProp('loop', EditorPropType.boolean))
    this.addEditorProp(new EditorProp('spread', EditorPropType.number))
  }

  public update(time: Time) {
    if (!this.isPlaying) return

    const dt = time.deltaSeconds
    // console.log(`update dt=${dt} active=${this.activeParticles}`)

    // Emission logic
    if (this.config.loop || this.timeElapsed < this.config.duration) {
      this.emissionAccumulator += dt * this.config.emissionRate

      if (this.emissionAccumulator > this.config.maxParticles) {
         this.emissionAccumulator = this.config.maxParticles
      }

      const particlesToEmit = Math.floor(this.emissionAccumulator)
      this.emissionAccumulator -= particlesToEmit

      // console.log(`emit ${particlesToEmit} particles`)
      for (let i = 0; i < particlesToEmit; i++) {
        if (this.activeParticles < this.config.maxParticles) {
            this.emit()
        } else {
            break
        }
      }
    }

    this.timeElapsed += dt

    // Simulation logic
    for (let i = 0; i < this.activeParticles; i++) {
      const offset = i * ParticleSystem.STRIDE

      this.particles[offset + 6] -= dt

      if (this.particles[offset + 6] <= 0) {
        // Kill particle (swap with last)
        this.swap(i, this.activeParticles - 1)
        this.activeParticles--
        i--
        continue
      }

      this.particles[offset] += this.particles[offset + 3] * dt
      this.particles[offset + 1] += this.particles[offset + 4] * dt
      this.particles[offset + 2] += this.particles[offset + 5] * dt
    }
  }

  private emit() {
    const offset = this.activeParticles * ParticleSystem.STRIDE

    const entityPos = this.entity?.transform.worldPosition || [0, 0, 0]

    this.particles[offset] = entityPos[0]
    this.particles[offset + 1] = entityPos[1]
    this.particles[offset + 2] = entityPos[2]

    let vx = 0, vy = 0, vz = 0

    if (this.config.emissionShape === 'sphere') {
        const theta = Math.random() * 2 * Math.PI
        const phi = Math.acos(2 * Math.random() - 1)
        vx = Math.sin(phi) * Math.cos(theta)
        vy = Math.sin(phi) * Math.sin(theta)
        vz = Math.cos(phi)
    } else if (this.config.emissionShape === 'box') {
        vx = (Math.random() - 0.5) * 2
        vy = (Math.random() - 0.5) * 2
        vz = (Math.random() - 0.5) * 2
    } else {
        const theta = Math.random() * 2 * Math.PI
        const phi = Math.random() * this.config.spread
        vx = Math.sin(phi) * Math.cos(theta)
        vy = Math.cos(phi)
        vz = Math.sin(phi) * Math.sin(theta)
    }

    const len = Math.sqrt(vx*vx + vy*vy + vz*vz)
    if (len > 0) {
        vx /= len
        vy /= len
        vz /= len
    }

    this.particles[offset + 3] = vx * this.config.speed
    this.particles[offset + 4] = vy * this.config.speed
    this.particles[offset + 5] = vz * this.config.speed

    this.particles[offset + 6] = this.config.lifetime
    this.particles[offset + 7] = this.config.lifetime

    this.particles[offset + 8] = this.config.size

    this.particles[offset + 9] = this.config.color[0]
    this.particles[offset + 10] = this.config.color[1]
    this.particles[offset + 11] = this.config.color[2]
    this.particles[offset + 12] = this.config.color[3]

    this.activeParticles++
  }

  private swap(index1: number, index2: number) {
    if (index1 === index2) return

    const offset1 = index1 * ParticleSystem.STRIDE
    const offset2 = index2 * ParticleSystem.STRIDE

    this.particles.copyWithin(offset1, offset2, offset2 + ParticleSystem.STRIDE)
  }

  public reset() {
    this.activeParticles = 0
    this.timeElapsed = 0
    this.emissionAccumulator = 0
  }
}
