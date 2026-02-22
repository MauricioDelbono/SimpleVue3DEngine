import { describe, it, expect } from 'vitest'
import { Collider } from './collider'
import { vec3 } from 'gl-matrix'

describe('Collider Benchmark', () => {
  it('benchmarks worldPosition allocation', () => {
    const collider = new Collider()
    // Warm up
    for (let i = 0; i < 1000; i++) {
      const p = collider.worldPosition
    }

    const start = performance.now()
    const iterations = 500000
    for (let i = 0; i < iterations; i++) {
      const p = collider.worldPosition
    }
    const end = performance.now()

    console.log(`[Benchmark] Time taken for ${iterations} iterations: ${(end - start).toFixed(2)}ms`)
    expect(true).toBe(true)
  })

  it('verifies worldPosition correctness', () => {
    const collider = new Collider()
    collider.transform.position = vec3.fromValues(1, 2, 3)
    collider.updateTransformMatrix()

    const p = collider.worldPosition
    // The current implementation adds local transform position (via worldMatrix) + local position property.
    // worldMatrix translates by [1,2,3]. position is [1,2,3]. result is [2,4,6].
    expect(p[0]).toBeCloseTo(2)
    expect(p[1]).toBeCloseTo(4)
    expect(p[2]).toBeCloseTo(6)
  })
})
