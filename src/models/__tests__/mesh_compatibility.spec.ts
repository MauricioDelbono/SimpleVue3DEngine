import { describe, it, expect } from 'vitest'
import { Mesh } from '../mesh'
import { vec3 } from 'gl-matrix'

describe('Mesh Compatibility', () => {
  it('should accept number arrays', () => {
    const positions = [0, 0, 0, 1, 1, 1]
    const mesh = new Mesh('test', positions)
    expect(mesh.positions).toEqual(positions)
    expect(mesh.vertices.length).toBe(2)
    expect(mesh.vertices[0]).toEqual(vec3.fromValues(0, 0, 0))
  })

  it('should accept Float32Array', () => {
    const positions = new Float32Array([0, 0, 0, 1, 1, 1])
    const mesh = new Mesh('test_typed', positions)
    expect(mesh.positions).toEqual(positions)
    expect(mesh.vertices.length).toBe(2)
    expect(mesh.vertices[0]).toEqual(vec3.fromValues(0, 0, 0))
  })

  it('should create empty vertices from empty array', () => {
    const mesh = new Mesh('empty')
    expect(mesh.vertices.length).toBe(0)
  })
})
