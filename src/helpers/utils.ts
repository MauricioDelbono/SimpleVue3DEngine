import { vec3 } from 'gl-matrix'
import { toRaw } from 'vue'

function radToDeg(r: number) {
  return (r * 180) / Math.PI
}

function radToDegVec3(radians: vec3) {
  return vec3.scale(radians, radians, 180 / Math.PI)
}

function degToRad(d: number) {
  return (d * Math.PI) / 180
}

function toRawDeep<T>(observed: T): T {
  const val = toRaw(observed)

  if (Array.isArray(val)) {
    return val.map(toRawDeep) as T
  }

  if (val === null) return null as T

  if (typeof val === 'object') {
    const entries = Object.entries(val).map(([key, val]) => [key, toRawDeep(val)])

    return Object.fromEntries(entries)
  }

  return val
}

export default { radToDeg, radToDegVec3, degToRad, toRawDeep }
