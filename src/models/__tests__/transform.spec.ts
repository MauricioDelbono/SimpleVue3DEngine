import { describe, it, expect } from 'vitest'
import { Transform } from '../transform'
import { mat4, vec3, quat } from 'gl-matrix'

describe('Transform', () => {
  it('should initialize with default values', () => {
    const t = new Transform()
    expect(t.position).toEqual(vec3.create())
    expect(t.rotation).toEqual(vec3.create())
    expect(t.scale).toEqual(vec3.fromValues(1, 1, 1))
  })

  it('getMatrix should return a valid matrix based on transform', () => {
    const t = new Transform()
    t.position = vec3.fromValues(1, 2, 3)
    t.rotation = vec3.fromValues(0, 90, 0) // 90 degrees around Y
    t.scale = vec3.fromValues(2, 2, 2)

    const mat = mat4.create()
    t.getMatrix(mat)

    // Expected position
    const pos = vec3.create()
    mat4.getTranslation(pos, mat)
    expect(pos[0]).toBeCloseTo(1)
    expect(pos[1]).toBeCloseTo(2)
    expect(pos[2]).toBeCloseTo(3)

    // Expected scale
    const scale = vec3.create()
    mat4.getScaling(scale, mat)
    expect(scale[0]).toBeCloseTo(2)
    expect(scale[1]).toBeCloseTo(2)
    expect(scale[2]).toBeCloseTo(2)

    // Expected rotation (around Y)
    const rot = quat.create()
    mat4.getRotation(rot, mat)
    // We can verify this by transforming a vector
    const v = vec3.fromValues(1, 0, 0)
    vec3.transformQuat(v, v, rot)
    // 90 deg rotation around Y should turn (1,0,0) to (0,0,-1) roughly?
    // Wait, gl-matrix euler is in degrees? The code uses `quat.fromEuler`.
    // Let's check `transform.ts` again. `quat.fromEuler` takes degrees.
    // X=1, RotY=90 -> Z should be -1.
    expect(v[0]).toBeCloseTo(0)
    expect(v[1]).toBeCloseTo(0)
    expect(v[2]).toBeCloseTo(-1)
  })

  it('getForwardVector should return correct direction', () => {
    const t = new Transform()
    // Default forward is (0, 0, 1) in this engine?
    // Let's check the code:
    // const forward = vec3.fromValues(0, 0, 1)
    // vec3.transformQuat(forward, forward, rotation)

    let fwd = t.getForwardVector()
    expect(fwd[0]).toBeCloseTo(0)
    expect(fwd[1]).toBeCloseTo(0)
    expect(fwd[2]).toBeCloseTo(1)

    // Rotate 90 deg around Y
    t.rotation = vec3.fromValues(0, 90, 0)
    fwd = t.getForwardVector()
    // (0,0,1) rotated 90 deg around Y -> (1,0,0)?
    // Let's visualize: Z axis points "forward". Y is up.
    // Rotating around Y by 90 deg (positive) usually goes from Z to X.
    expect(fwd[0]).toBeCloseTo(1)
    expect(fwd[1]).toBeCloseTo(0)
    expect(fwd[2]).toBeCloseTo(0)
  })

  it('getRightVector should return correct direction', () => {
    const t = new Transform()
    // Default right is (1, 0, 0)
    let right = t.getRightVector()
    expect(right[0]).toBeCloseTo(1)
    expect(right[1]).toBeCloseTo(0)
    expect(right[2]).toBeCloseTo(0)

    // Rotate 90 deg around Y
    t.rotation = vec3.fromValues(0, 90, 0)
    right = t.getRightVector()
    // (1,0,0) rotated 90 deg around Y -> (0,0,-1)
    expect(right[0]).toBeCloseTo(0)
    expect(right[1]).toBeCloseTo(0)
    expect(right[2]).toBeCloseTo(-1)
  })

  it('getUpVector should return correct direction', () => {
    const t = new Transform()
    // Default up is (0, 1, 0)
    let up = t.getUpVector()
    expect(up[0]).toBeCloseTo(0)
    expect(up[1]).toBeCloseTo(1)
    expect(up[2]).toBeCloseTo(0)

    // Rotate 90 deg around Z
    t.rotation = vec3.fromValues(0, 0, 90)
    up = t.getUpVector()
    // (0,1,0) rotated 90 deg around Z -> (-1,0,0)
    expect(up[0]).toBeCloseTo(-1)
    expect(up[1]).toBeCloseTo(0)
    expect(up[2]).toBeCloseTo(0)
  })
})
