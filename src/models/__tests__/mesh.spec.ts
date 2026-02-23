import { describe, it, expect } from 'vitest'
import { Mesh } from '@/models/mesh'
import { vec3 } from 'gl-matrix'

describe('Mesh', () => {
  it('should calculate AABB correctly in constructor', () => {
    const positions = [
      -1, -1, -1, // min corner
      1, 1, 1,    // max corner
      0, 2, 0     // new max y
    ]

    // Create mesh
    const mesh = new Mesh('TestMesh', positions)

    // Expected min: [-1, -1, -1]
    // Expected max: [1, 2, 1]

    expect(mesh.min[0]).toBe(-1)
    expect(mesh.min[1]).toBe(-1)
    expect(mesh.min[2]).toBe(-1)

    expect(mesh.max[0]).toBe(1)
    expect(mesh.max[1]).toBe(2)
    expect(mesh.max[2]).toBe(1)
  })

  it('should handle empty mesh with default infinity AABB', () => {
    const mesh = new Mesh('EmptyMesh')

    expect(mesh.min[0]).toBe(Infinity)
    expect(mesh.max[0]).toBe(-Infinity)
  })
})
