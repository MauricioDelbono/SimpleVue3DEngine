import { describe, it, expect } from 'vitest'
import { Frustum } from '@/models/frustum'
import { mat4, vec3 } from 'gl-matrix'

describe('Frustum', () => {
  it('should initialize with 6 planes', () => {
    const frustum = new Frustum()
    expect(frustum.planes.length).toBe(6)
  })

  it('should correctly identify visible boxes with identity matrix', () => {
    const frustum = new Frustum()
    const identity = mat4.create() // Identity matrix
    frustum.setFromProjectionMatrix(identity)

    // Identity VP implies NDC box [-1, 1] on all axes

    // 1. Box completely inside
    const insideMin = vec3.fromValues(-0.5, -0.5, -0.5)
    const insideMax = vec3.fromValues(0.5, 0.5, 0.5)
    expect(frustum.intersectsBox(insideMin, insideMax)).toBe(true)

    // 2. Box intersecting boundary
    const intersectMin = vec3.fromValues(0.5, 0.5, 0.5)
    const intersectMax = vec3.fromValues(1.5, 1.5, 1.5)
    expect(frustum.intersectsBox(intersectMin, intersectMax)).toBe(true)

    // 3. Box completely outside (Right)
    const outsideRightMin = vec3.fromValues(1.1, -0.5, -0.5)
    const outsideRightMax = vec3.fromValues(2.0, 0.5, 0.5)
    expect(frustum.intersectsBox(outsideRightMin, outsideRightMax)).toBe(false)

    // 4. Box completely outside (Left)
    const outsideLeftMin = vec3.fromValues(-2.0, -0.5, -0.5)
    const outsideLeftMax = vec3.fromValues(-1.1, 0.5, 0.5)
    expect(frustum.intersectsBox(outsideLeftMin, outsideLeftMax)).toBe(false)

    // 5. Box surrounding frustum
    const surroundMin = vec3.fromValues(-2, -2, -2)
    const surroundMax = vec3.fromValues(2, 2, 2)
    expect(frustum.intersectsBox(surroundMin, surroundMax)).toBe(true)
  })
})
