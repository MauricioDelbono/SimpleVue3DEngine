import { describe, it, expect, vi } from 'vitest'
import { Entity } from '@/models/entity'
import { Component } from '@/models/component'

class MockComponent extends Component {
  constructor() {
    super()
  }
}

describe('Entity', () => {
  describe('removeComponent', () => {
    it('should remove a component and destroy it', () => {
      const entity = new Entity()
      const component = new MockComponent()

      // Add component first
      entity.addComponent(component)

      // Spy on destroy method
      const destroySpy = vi.spyOn(component, 'destroy')

      // Remove component
      entity.removeComponent(component)

      // Expect component to be removed
      expect(entity.components).not.toContain(component)

      // Expect destroy to be called
      expect(destroySpy).toHaveBeenCalled()
    })

    it('should do nothing if component is not found', () => {
      const entity = new Entity()
      const component = new MockComponent()

      // Don't add component

      // Spy on destroy method
      const destroySpy = vi.spyOn(component, 'destroy')

      // Try to remove component
      entity.removeComponent(component)

      // Expect destroy not to be called
      expect(destroySpy).not.toHaveBeenCalled()
    })
  })
})
