import { toRaw } from 'vue'

function radToDeg(r: number) {
  return (r * 180) / Math.PI
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

export default { radToDeg, degToRad, toRawDeep }
