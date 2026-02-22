import { describe, it, expect, beforeEach } from 'vitest'
import { ParticleSystem } from '../particleSystem'
import { Time } from '@/models/time'

describe('ParticleSystem', () => {
  let particleSystem: ParticleSystem
  let time: Time

  beforeEach(() => {
    particleSystem = new ParticleSystem(100)
    time = new Time(0)
    particleSystem.emissionRate = 10
    particleSystem.lifetime = 1.0
    particleSystem.speed = 1.0
    particleSystem.startSize = 0.1
    particleSystem.endSize = 0.1
    particleSystem.loop = true
    particleSystem.playing = true
    particleSystem.activeParticles = 0
  })

  it('should initialize correctly', () => {
    expect(particleSystem.maxParticles).toBe(100)
    expect(particleSystem.activeParticles).toBe(0)
    expect(particleSystem.data.length).toBe(100 * 13)
  })

  it('should emit particles over time', () => {
    const t0 = new Time(0)
    const t1 = new Time(100, t0) // 100ms elapsed. dt = 0.1s

    // With rate 10, dt 0.1, we expect 1 particle.
    particleSystem.update(t1)

    expect(particleSystem.activeParticles).toBeGreaterThanOrEqual(1)
  })

  it('should update particle positions', () => {
    particleSystem.emissionRate = 0 // Stop auto emission
    particleSystem.lifetime = 2.0 // Ensure particle survives the update
    // Manually emit
    particleSystem['emit']()
    expect(particleSystem.activeParticles).toBe(1)

    const initialY = particleSystem.data[1] // Y position
    particleSystem.gravity = [0, 10, 0] // Upward gravity

    const t0 = new Time(0)
    const t1 = new Time(1000, t0) // 1s

    particleSystem.update(t1)

    const newY = particleSystem.data[1]
    expect(newY).toBeGreaterThan(initialY)
  })

  it('should kill particles after lifetime', () => {
    particleSystem.lifetime = 0.5
    particleSystem.emissionRate = 0

    particleSystem['emit']()
    expect(particleSystem.activeParticles).toBe(1)

    const t0 = new Time(0)
    const t1 = new Time(600, t0) // 0.6s > 0.5s lifetime

    particleSystem.update(t1)

    expect(particleSystem.activeParticles).toBe(0)
  })

  it('should swap particles when killing', () => {
    particleSystem.emissionRate = 0
    particleSystem.activeParticles = 3

    // Set MaxLife (offset 7) as identifier
    particleSystem.data[7] = 100 // P0
    particleSystem.data[13 + 7] = 200 // P1
    particleSystem.data[26 + 7] = 300 // P2

    // Kill P0 by setting Age > MaxLife
    particleSystem.data[6] = 101 // Age > 100

    const t0 = new Time(0)
    const t1 = new Time(10, t0)

    particleSystem.update(t1)

    expect(particleSystem.activeParticles).toBe(2)

    // P0 should now be P2 (MaxLife 300)
    expect(particleSystem.data[0 + 7]).toBe(300)

    // P1 should be untouched (MaxLife 200)
    expect(particleSystem.data[13 + 7]).toBe(200)
  })
})
