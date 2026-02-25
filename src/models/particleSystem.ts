import { Component, EditorProp, EditorPropType } from './component'
import { ParticleMesh } from './particleMesh'
import type { Time } from './time'
import { vec3, vec4 } from 'gl-matrix'

export class ParticleSystem extends Component {
  public mesh: ParticleMesh
  public maxParticles: number = 1000
  public emissionRate: number = 10 // particles per second
  public lifetime: number = 1.0
  public speed: number = 1.0
  public gravity: vec3 = [0, -9.8, 0]
  public startColor: vec3 = [1, 1, 1]
  public startAlpha: number = 1.0
  public endColor: vec3 = [1, 1, 0]
  public endAlpha: number = 0.0
  public size: number = 0.1

  private emissionAccumulator: number = 0

  constructor(maxParticles: number = 1000) {
    super()
    this.maxParticles = maxParticles
    this.mesh = new ParticleMesh(maxParticles)

    // Editor Props
    this.addEditorProp(new EditorProp('maxParticles', EditorPropType.number, true))
    this.addEditorProp(new EditorProp('emissionRate', EditorPropType.number))
    this.addEditorProp(new EditorProp('lifetime', EditorPropType.number))
    this.addEditorProp(new EditorProp('speed', EditorPropType.number))
    this.addEditorProp(new EditorProp('size', EditorPropType.number))
    this.addEditorProp(new EditorProp('startAlpha', EditorPropType.number))
    this.addEditorProp(new EditorProp('endAlpha', EditorPropType.number))
    this.addEditorProp(new EditorProp('gravity', EditorPropType.vec3))
    this.addEditorProp(new EditorProp('startColor', EditorPropType.vec3))
    this.addEditorProp(new EditorProp('endColor', EditorPropType.vec3))
  }

  public awake() {
    super.awake()
    this.entity.mesh = this.mesh
    this.entity.pipeline = 'particle'
  }

  public update(time: Time) {
    const dt = time.deltaSeconds

    // Emission
    this.emissionAccumulator += this.emissionRate * dt
    const spawnCount = Math.floor(this.emissionAccumulator)
    this.emissionAccumulator -= spawnCount

    for (let i = 0; i < spawnCount; i++) {
      this.spawnParticle()
    }

    // Simulation
    const data = this.mesh.instanceData
    let count = this.mesh.activeCount

    for (let i = 0; i < count; i++) {
      const offset = i * 13

      // Life
      let life = data[offset + 6]
      const maxLife = data[offset + 7]
      life -= dt

      if (life <= 0) {
        // Kill
        count--
        if (i < count) {
          const srcOffset = count * 13
          const dstOffset = i * 13
          data.copyWithin(dstOffset, srcOffset, srcOffset + 13)
        }
        i--
        continue
      }

      data[offset + 6] = life

      // Velocity
      let vx = data[offset + 3]
      let vy = data[offset + 4]
      let vz = data[offset + 5]

      vx += this.gravity[0] * dt
      vy += this.gravity[1] * dt
      vz += this.gravity[2] * dt

      data[offset + 3] = vx
      data[offset + 4] = vy
      data[offset + 5] = vz

      // Position
      data[offset + 0] += vx * dt
      data[offset + 1] += vy * dt
      data[offset + 2] += vz * dt

      // Color interpolation
      const lifeRatio = life / maxLife
      const t = 1.0 - lifeRatio

      data[offset + 9] = this.lerp(this.startColor[0], this.endColor[0], t)
      data[offset + 10] = this.lerp(this.startColor[1], this.endColor[1], t)
      data[offset + 11] = this.lerp(this.startColor[2], this.endColor[2], t)
      data[offset + 12] = this.lerp(this.startAlpha, this.endAlpha, t)
    }

    this.mesh.activeCount = count
  }

  private spawnParticle() {
    if (this.mesh.activeCount >= this.maxParticles) return

    const index = this.mesh.activeCount
    const offset = index * 13
    const data = this.mesh.instanceData

    // Position (World Space)
    const pos = this.entity.transform.worldPosition
    data[offset + 0] = pos[0]
    data[offset + 1] = pos[1]
    data[offset + 2] = pos[2]

    // Velocity: Random direction * speed
    const r1 = Math.random() * 2 - 1
    const r2 = Math.random() * 2 - 1
    const r3 = Math.random() * 2 - 1
    const len = Math.sqrt(r1 * r1 + r2 * r2 + r3 * r3) || 1

    data[offset + 3] = (r1 / len) * this.speed
    data[offset + 4] = (r2 / len) * this.speed
    data[offset + 5] = (r3 / len) * this.speed

    // Life
    data[offset + 6] = this.lifetime
    data[offset + 7] = this.lifetime

    // Size
    data[offset + 8] = this.size

    // Color
    data[offset + 9] = this.startColor[0]
    data[offset + 10] = this.startColor[1]
    data[offset + 11] = this.startColor[2]
    data[offset + 12] = this.startAlpha

    this.mesh.activeCount++
  }

  private lerp(a: number, b: number, t: number) {
    return a + (b - a) * t
  }
}
