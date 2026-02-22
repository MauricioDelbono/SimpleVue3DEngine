import { describe, it, expect } from 'vitest'
import { DepthOfField, Scene } from '../scene'

describe('DepthOfField', () => {
  it('should have default values', () => {
    const dof = new DepthOfField()
    expect(dof.enabled).toBe(false)
    expect(dof.focusDistance).toBe(10.0)
    expect(dof.focusRange).toBe(5.0)
    expect(dof.bokehRadius).toBe(5.0)
  })

  it('should be integrated into Scene', () => {
    const scene = new Scene()
    expect(scene.depthOfField).toBeDefined()
    expect(scene.depthOfField).toBeInstanceOf(DepthOfField)
    expect(scene.depthOfField.enabled).toBe(false)
  })

  it('should allow configuration', () => {
    const scene = new Scene()
    scene.depthOfField.enabled = true
    scene.depthOfField.focusDistance = 20.0

    expect(scene.depthOfField.enabled).toBe(true)
    expect(scene.depthOfField.focusDistance).toBe(20.0)
  })
})
