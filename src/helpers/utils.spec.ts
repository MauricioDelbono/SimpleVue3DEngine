import { describe, it, expect } from 'vitest'
import { vec3 } from 'gl-matrix'
import utils from './utils'

describe('utils', () => {
  describe('radToDegVec3', () => {
    it('converts radians to degrees', () => {
      const radians = vec3.fromValues(Math.PI, Math.PI / 2, 0)
      const degrees = utils.radToDegVec3(radians)

      expect(degrees[0]).toBeCloseTo(180)
      expect(degrees[1]).toBeCloseTo(90)
      expect(degrees[2]).toBeCloseTo(0)
    })

    it('modifies the input vector in place', () => {
      const radians = vec3.fromValues(Math.PI, Math.PI / 2, 0)
      const result = utils.radToDegVec3(radians)

      expect(result).toBe(radians)
    })

    it('handles negative values', () => {
      const radians = vec3.fromValues(-Math.PI, -Math.PI / 2, 0)
      const degrees = utils.radToDegVec3(radians)

      expect(degrees[0]).toBeCloseTo(-180)
      expect(degrees[1]).toBeCloseTo(-90)
      expect(degrees[2]).toBeCloseTo(0)
    })
  })
})
