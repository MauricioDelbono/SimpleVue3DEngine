import { Component, EditorProp, EditorPropType } from './component'
import type { Time } from './time'
import { vec3, vec4 } from 'gl-matrix'

export class ParticleSystem extends Component {
  public maxParticles: number = 1000
  public emissionRate: number = 10 // particles per second
  public lifetime: number = 5.0
  public speed: number = 1.0
  public size: number = 0.5
  public color: vec4 = [1, 1, 1, 1]
  public gravity: vec3 = [0, -9.81, 0]
  public direction: vec3 = [0, 1, 0]
  public spread: number = 0.5 // Random factor

  // Interleaved data for GPU: [x, y, z, size, r, g, b, a]
  public particleData: Float32Array
  // Simulation data: [vx, vy, vz, life, maxLife]
  public simulationData: Float32Array

  public activeParticles: number = 0
  private emissionAccumulator: number = 0

  constructor(maxParticles: number = 1000) {
    super()
    this.maxParticles = maxParticles
    this.particleData = new Float32Array(maxParticles * 8)
    this.simulationData = new Float32Array(maxParticles * 5)

    this.addEditorProp(new EditorProp('maxParticles', EditorPropType.number))
    this.addEditorProp(new EditorProp('emissionRate', EditorPropType.number))
    this.addEditorProp(new EditorProp('lifetime', EditorPropType.number))
    this.addEditorProp(new EditorProp('speed', EditorPropType.number))
    this.addEditorProp(new EditorProp('size', EditorPropType.number))
    this.addEditorProp(new EditorProp('spread', EditorPropType.number))
    this.addEditorProp(new EditorProp('gravity', EditorPropType.vec3))
    this.addEditorProp(new EditorProp('direction', EditorPropType.vec3))
  }

  update(time: Time) {
    const dt = time.deltaSeconds

    // Emission
    this.emissionAccumulator += dt
    const particlesToEmit = Math.floor(this.emissionAccumulator * this.emissionRate)
    this.emissionAccumulator -= particlesToEmit / this.emissionRate // Keep remainder

    for (let i = 0; i < particlesToEmit; i++) {
      this.emit()
    }

    // Update particles
    for (let i = 0; i < this.activeParticles; i++) {
      const simIndex = i * 5
      const dataIndex = i * 8

      // Update life
      this.simulationData[simIndex + 3] -= dt
      if (this.simulationData[simIndex + 3] <= 0) {
        this.kill(i)
        i-- // Process this index again as it's now a new particle
        continue
      }

      // Physics
      const lifeRatio = this.simulationData[simIndex + 3] / this.simulationData[simIndex + 4]

      // Velocity += Gravity * dt
      this.simulationData[simIndex] += this.gravity[0] * dt
      this.simulationData[simIndex + 1] += this.gravity[1] * dt
      this.simulationData[simIndex + 2] += this.gravity[2] * dt

      // Position += Velocity * dt
      this.particleData[dataIndex] += this.simulationData[simIndex] * dt
      this.particleData[dataIndex + 1] += this.simulationData[simIndex + 1] * dt
      this.particleData[dataIndex + 2] += this.simulationData[simIndex + 2] * dt

      // Fade out alpha
      this.particleData[dataIndex + 7] = this.color[3] * lifeRatio
    }
  }

  emit() {
    if (this.activeParticles >= this.maxParticles) return

    const i = this.activeParticles
    const simIndex = i * 5
    const dataIndex = i * 8

    // Init simulation data
    // Random direction within spread
    const r1 = Math.random() * 2 - 1
    const r2 = Math.random() * 2 - 1
    const r3 = Math.random() * 2 - 1
    const randDir = vec3.fromValues(r1, r2, r3)
    vec3.normalize(randDir, randDir)

    // Mix with base direction
    const dir = vec3.clone(this.direction)
    vec3.scaleAndAdd(dir, dir, randDir, this.spread)
    vec3.normalize(dir, dir)

    const speed = this.speed * (0.5 + Math.random() * 0.5) // Randomize speed a bit

    this.simulationData[simIndex] = dir[0] * speed
    this.simulationData[simIndex + 1] = dir[1] * speed
    this.simulationData[simIndex + 2] = dir[2] * speed
    this.simulationData[simIndex + 3] = this.lifetime
    this.simulationData[simIndex + 4] = this.lifetime

    // Init GPU data
    // Start at entity position
    const worldPos = this.entity.transform.worldPosition
    this.particleData[dataIndex] = worldPos[0]
    this.particleData[dataIndex + 1] = worldPos[1]
    this.particleData[dataIndex + 2] = worldPos[2]
    this.particleData[dataIndex + 3] = this.size

    this.particleData[dataIndex + 4] = this.color[0]
    this.particleData[dataIndex + 5] = this.color[1]
    this.particleData[dataIndex + 6] = this.color[2]
    this.particleData[dataIndex + 7] = this.color[3]

    this.activeParticles++
  }

  kill(index: number) {
    this.activeParticles--
    const lastIndex = this.activeParticles

    // Swap current with last
    if (index !== lastIndex) {
      const simIndex = index * 5
      const lastSimIndex = lastIndex * 5
      const dataIndex = index * 8
      const lastDataIndex = lastIndex * 8

      // Copy simulation data
      for (let k = 0; k < 5; k++) {
        this.simulationData[simIndex + k] = this.simulationData[lastSimIndex + k]
      }
      // Copy GPU data
      for (let k = 0; k < 8; k++) {
        this.particleData[dataIndex + k] = this.particleData[lastDataIndex + k]
      }
    }
  }
}
