import { mat4, vec3, vec4 } from 'gl-matrix'

export const CASCADE_COUNT = 3
export const SHADOW_MAP_SIZE = 2048

export function getFrustumCornersWorldSpace(proj: mat4, view: mat4): vec4[] {
  const inv = mat4.create()
  mat4.multiply(inv, proj, view)
  mat4.invert(inv, inv)

  const frustumCorners: vec4[] = []
  for (let x = 0; x < 2; ++x) {
    for (let y = 0; y < 2; ++y) {
      for (let z = 0; z < 2; ++z) {
        const pt = vec4.fromValues(
          2.0 * x - 1.0,
          2.0 * y - 1.0,
          2.0 * z - 1.0,
          1.0
        )
        vec4.transformMat4(pt, pt, inv)
        vec4.scale(pt, pt, 1.0 / pt[3])
        frustumCorners.push(pt)
      }
    }
  }

  return frustumCorners
}

export function getLightSpaceMatrix(
  cameraView: mat4,
  fov: number,
  aspect: number,
  near: number,
  far: number,
  lightDir: vec3
): mat4 {
  const proj = mat4.create()
  mat4.perspective(proj, fov, aspect, near, far)
  const corners = getFrustumCornersWorldSpace(proj, cameraView)

  const center = vec3.create()
  for (const v of corners) {
    vec3.add(center, center, [v[0], v[1], v[2]])
  }
  vec3.scale(center, center, 1.0 / corners.length)

  const lightView = mat4.create()
  const target = vec3.create()
  vec3.add(target, center, lightDir)

  let up = vec3.fromValues(0, 1, 0)
  if (Math.abs(vec3.dot(lightDir, up)) > 0.99) {
      up = vec3.fromValues(0, 0, 1)
  }

  mat4.lookAt(
    lightView,
    center,
    target,
    up
  )

  let minX = Number.MAX_VALUE
  let maxX = -Number.MAX_VALUE
  let minY = Number.MAX_VALUE
  let maxY = -Number.MAX_VALUE
  let minZ = Number.MAX_VALUE
  let maxZ = -Number.MAX_VALUE

  for (const v of corners) {
    const trf = vec4.create()
    vec4.transformMat4(trf, v, lightView)
    minX = Math.min(minX, trf[0])
    maxX = Math.max(maxX, trf[0])
    minY = Math.min(minY, trf[1])
    maxY = Math.max(maxY, trf[1])
    minZ = Math.min(minZ, trf[2])
    maxZ = Math.max(maxZ, trf[2])
  }

  // Extend Z to include potential occluders between light and frustum
  // This is a heuristic. A better way is to use scene AABB.
  // But since we don't have easy access to scene AABB here, we extend backwards.
  const zMult = 10.0
  if (minZ < 0) minZ *= zMult
  else minZ /= zMult

  if (maxZ < 0) maxZ /= zMult
  else maxZ *= zMult

  const lightProjection = mat4.create()
  mat4.ortho(lightProjection, minX, maxX, minY, maxY, minZ, maxZ)

  const lightSpaceMatrix = mat4.create()
  mat4.multiply(lightSpaceMatrix, lightProjection, lightView)

  return lightSpaceMatrix
}

export function getCascadeSplits(near: number, far: number, count: number, lambda: number): number[] {
  const splits = new Array(count + 1)
  splits[0] = near
  splits[count] = far

  for (let i = 1; i < count; i++) {
    const p = i / count
    const log = near * Math.pow(far / near, p)
    const uniform = near + (far - near) * p
    splits[i] = lambda * log + (1 - lambda) * uniform
  }
  return splits
}
