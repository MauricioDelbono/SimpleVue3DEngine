import { describe, it, expect } from 'vitest'
import { ParticleSystem } from '@/models/particleSystem'
import { Entity } from '@/models/entity'
import { Time } from '@/models/time'

describe('ParticleSystem', () => {
  it('should initialize with default config', () => {
    const ps = new ParticleSystem()
    expect(ps.config.maxParticles).toBe(1000)
    expect(ps.activeParticles).toBe(0)
    expect(ps.particles.length).toBe(1000 * ParticleSystem.STRIDE)
  })

  it('should emit particles over time', () => {
    const ps = new ParticleSystem({ emissionRate: 10, loop: true })
    const entity = new Entity()
    entity.addComponent(ps)

    // Update for 1 second. deltaSeconds = 1.
    const t1 = new Time(1000, new Time(0))

    ps.update(t1)

    expect(ps.activeParticles).toBe(10)
  })

  it('should update particle life and remove dead particles', () => {
    const ps = new ParticleSystem({ emissionRate: 10, lifetime: 0.5, loop: true })
    const entity = new Entity()
    entity.addComponent(ps)

    // t1: delta 0.1s
    const t1 = new Time(100, new Time(0))
    ps.update(t1)
    // emitted: 1. active: 1.
    // p[0] life: 0.5 - 0.1 = 0.4.

    expect(ps.activeParticles).toBe(1)

    // t2: delta 0.41s (slightly more than 0.4 to ensure float precision doesn't keep it alive)
    const t2 = new Time(510, new Time(100))
    ps.update(t2)
    // emission: 10 * 0.41 = 4.1 -> 4 particles. active -> 5.
    // simulation:
    // p[0] (old): life 0.4 - 0.41 = -0.01. REMOVED. active -> 4.
    // p[1..4] (new): life 0.5 - 0.41 = 0.09. Alive.

    expect(ps.activeParticles).toBe(4)
  })

  it('should limit emission to maxParticles', () => {
    const ps = new ParticleSystem({ maxParticles: 5, emissionRate: 100, loop: true })
    const entity = new Entity()
    entity.addComponent(ps)

    const t1 = new Time(1000, new Time(0)) // 1s -> 100 particles
    ps.update(t1)

    expect(ps.activeParticles).toBe(5)
  })

  it('should simulate particle movement', () => {
    const ps = new ParticleSystem({
        emissionRate: 10,
        loop: true,
        speed: 10,
        emissionShape: 'box' // random direction
    })
    const entity = new Entity()
    entity.addComponent(ps)

    const t1 = new Time(100, new Time(0)) // 0.1s
    ps.update(t1)

    // active: 1
    const offset = 0
    const x = ps.particles[offset]
    const y = ps.particles[offset + 1]
    const z = ps.particles[offset + 2]

    // initial pos is 0,0,0 (entity default).
    // p += v * dt
    // v is not zero (speed 10).

    expect(x !== 0 || y !== 0 || z !== 0).toBe(true)
  })
})
