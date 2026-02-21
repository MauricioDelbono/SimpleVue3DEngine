import { describe, it, expect } from 'vitest'
import { SphereCollider } from './sphereCollider'
import { Collider } from './collider'

class UnsupportedCollider extends Collider {
  // Minimal implementation to satisfy abstract methods if necessary, though they are not called in this test.
}

describe('SphereCollider', () => {
  describe('testCollision', () => {
    it('should throw an error when colliding with an unsupported collider', () => {
      const sphereCollider = new SphereCollider()
      const unsupportedCollider = new UnsupportedCollider()

      expect(() => {
        sphereCollider.testCollision(unsupportedCollider)
      }).toThrowError('Collider not supported')
    })
  })
})
