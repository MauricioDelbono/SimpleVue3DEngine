import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { SSAO, Scene } from '../scene'

describe('SSAO', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should have default values', () => {
    const ssao = new SSAO()
    expect(ssao.enabled).toBe(false)
    expect(ssao.kernelSize).toBe(64)
    expect(ssao.radius).toBe(0.5)
    expect(ssao.bias).toBe(0.025)
    expect(ssao.power).toBe(2.0)
  })

  it('should be integrated into Scene', () => {
    const scene = new Scene()
    expect(scene.ssao).toBeDefined()
    expect(scene.ssao).toBeInstanceOf(SSAO)
    expect(scene.ssao.enabled).toBe(false)
  })

  it('should allow configuration', () => {
    const scene = new Scene()
    scene.ssao.enabled = true
    scene.ssao.radius = 1.0

    expect(scene.ssao.enabled).toBe(true)
    expect(scene.ssao.radius).toBe(1.0)
  })
})
