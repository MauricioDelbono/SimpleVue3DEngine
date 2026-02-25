import { describe, it, expect, beforeEach } from 'vitest'
import { ParticleSystem } from '../particleSystem'
import { Time } from '../time'
import { Entity } from '../entity'

describe('ParticleSystem', () => {
  let particleSystem: ParticleSystem
  let entity: Entity

  beforeEach(() => {
    entity = new Entity()
    particleSystem = new ParticleSystem(100)
    entity.addComponent(particleSystem)
    // Manually awake since entity logic might not trigger it in isolation without scene
    particleSystem.awake()
  })

  it('should initialize correctly', () => {
    expect(particleSystem.mesh.maxParticles).toBe(100)
    expect(particleSystem.mesh.activeCount).toBe(0)
    expect(particleSystem.mesh.instanceData.length).toBe(100 * 13)
  })

  it('should spawn particles over time', () => {
    const time = new Time(500) // 0.5 second
    time.deltaSeconds = 0.5 // 0.5 second elapsed

    particleSystem.emissionRate = 10
    particleSystem.lifetime = 1.0
    particleSystem.update(time)

    expect(particleSystem.mesh.activeCount).toBe(5)
  })

  it('should move particles based on velocity and gravity', () => {
    const time = new Time(100)
    time.deltaSeconds = 0.1

    particleSystem.emissionRate = 10
    particleSystem.gravity = [0, -10, 0]
    particleSystem.speed = 0 // No random velocity

    // Update once to spawn
    particleSystem.update(time) // spawns 1 particle (10 * 0.1)

    expect(particleSystem.mesh.activeCount).toBe(1)

    const data = particleSystem.mesh.instanceData
    // Initial position should be 0,0,0 (entity pos)
    // But update moves it immediately after spawning?
    // Let's check logic: Spawn -> Loop over active -> Move.
    // Yes, spawned particles are processed in the same frame.

    // Initial velocity is 0 (speed 0).
    // Gravity adds to velocity: vy = -10 * 0.1 = -1.
    // Position updates: y += vy * dt = -1 * 0.1 = -0.1.

    // Offset 0 is x, 1 is y, 2 is z.
    // Offset 3 is vx, 4 is vy, 5 is vz.

    expect(data[4]).toBeCloseTo(-1)
    expect(data[1]).toBeCloseTo(-0.1)
  })

  it('should kill particles after lifetime', () => {
    const time = new Time(100)
    time.deltaSeconds = 0.5

    particleSystem.emissionRate = 2 // 1 per 0.5s
    particleSystem.lifetime = 0.4 // Die quickly

    particleSystem.update(time) // Spawns 1. Life 0.4. Update reduces life by 0.5 -> -0.1. Dies.

    expect(particleSystem.mesh.activeCount).toBe(0)
  })
})
