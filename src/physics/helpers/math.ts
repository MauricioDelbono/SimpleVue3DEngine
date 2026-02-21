import { quat, vec2, vec3, vec4 } from 'gl-matrix'

import type { ShapeInterface } from './shape'
import { PriorityQueue } from './priorityQueue'

const aux = vec3.create()
const mixed = (a: vec3, b: vec3, c: vec3) => vec3.dot(a, vec3.cross(aux, b, c))

export interface SupportPoint {
  diff: vec3 // support0 - support1
  support0: vec3
  support1: vec3
}
export type Simplex<T> = Set<T>
export type Polytop<T = SupportPoint> = PriorityQueue<Face<T>>
export interface Face<T = SupportPoint> {
  vertices: T[]
  siblings: [Face<T>, Face<T>, Face<T>] // edgeIndex -> face
  adjacent: [number, number, number] // siblings[i].siblings[adjacent[i]] == this
  closest: vec3
  closestBary: vec3
  distance: number
  obsolete: boolean
}
export type Silhouette<T = SupportPoint> = Array<[Face<T>, number]>

export const origin = vec3.create()
export const fromBarycentric = <T extends ArrayLike<number>>(out: vec3, barycentric: T, ...points: vec3[]) => {
  vec3.set(out, 0.0, 0.0, 0.0)
  for (let i = 0; i < barycentric.length; i++) {
    vec3.scaleAndAdd(out, out, points[i], barycentric[i])
  }
  return out
}

export const closestPointToTetrahedron = (out: vec4, a: vec3, b: vec3, c: vec3, d: vec3, p: vec3): vec4 => {
  // check voronoi region of a
  const ap = vec3.subtract(vec3.create(), p, a)
  const ab = vec3.subtract(vec3.create(), b, a)
  const ac = vec3.subtract(vec3.create(), c, a)
  const ad = vec3.subtract(vec3.create(), d, a)
  const apOab = vec3.dot(ap, ab)
  const apOac = vec3.dot(ap, ac)
  const apOad = vec3.dot(ap, ad)

  if (apOab <= 0 && apOac <= 0 && apOad <= 0) {
    return vec4.set(out, 1.0, 0.0, 0.0, 0.0)
  }

  // check voronoi region of b
  const bp = vec3.subtract(vec3.create(), p, b)
  const bc = vec3.subtract(vec3.create(), c, b)
  const bd = vec3.subtract(vec3.create(), d, b)
  const bpOba = -vec3.dot(bp, ab)
  const bpObc = vec3.dot(bp, bc)
  const bpObd = vec3.dot(bp, bd)

  if (bpOba <= 0 && bpObc <= 0 && bpObd <= 0) {
    return vec4.set(out, 0.0, 1.0, 0.0, 0.0)
  }

  // check voronoi region of c
  const cp = vec3.subtract(vec3.create(), p, c)
  const cd = vec3.subtract(vec3.create(), d, c)
  const cpOca = -vec3.dot(cp, ac)
  const cpOcb = -vec3.dot(cp, bc)
  const cpOcd = vec3.dot(cp, cd)

  if (cpOca <= 0 && cpOcb <= 0 && cpOcd <= 0) {
    return vec4.set(out, 0.0, 0.0, 1.0, 0.0)
  }

  // check voronoi region of d
  const dp = vec3.subtract(vec3.create(), p, d)
  const dpOda = -vec3.dot(dp, ad)
  const dpOdb = -vec3.dot(dp, bd)
  const dpOdc = -vec3.dot(dp, cd)

  if (dpOda <= 0 && dpOdb <= 0 && dpOdc <= 0) {
    return vec4.set(out, 0.0, 0.0, 0.0, 1.0)
  }

  // check voronoi region of ab edge
  const nAbc = vec3.cross(vec3.create(), ab, ac)
  const nAbd = vec3.cross(vec3.create(), ad, ab)
  const apOabXnAbc = mixed(ap, ab, nAbc)
  const apOnAbdXab = mixed(ap, nAbd, ab)
  if (apOab >= 0 && bpOba >= 0 && apOabXnAbc >= 0 && apOnAbdXab >= 0) {
    const t = apOab / vec3.dot(ab, ab)
    return vec4.set(out, 1.0 - t, t, 0.0, 0.0)
  }

  // check voronoi region of ac edge
  const nAcd = vec3.cross(vec3.create(), ac, ad)
  const apOnAbcXac = mixed(ap, nAbc, ac)
  const apOacXnAcd = mixed(ap, ac, nAcd)
  if (apOac >= 0 && cpOca >= 0 && apOnAbcXac >= 0 && apOacXnAcd >= 0) {
    const t = apOac / vec3.dot(ac, ac)
    return vec4.set(out, 1.0 - t, 0.0, t, 0.0)
  }

  // check voronoi region of ad edge
  const apOnAcdXad = mixed(ap, nAcd, ad)
  const apOadXnAbd = mixed(ap, ad, nAbd)
  if (apOad >= 0 && dpOda >= 0 && apOnAcdXad >= 0 && apOadXnAbd >= 0) {
    const t = apOad / vec3.dot(ad, ad)
    vec4.set(out, 1.0 - t, 0.0, 0.0, t)
    return vec4.create()
  }

  // check voronoi region of bc edge
  const nBcd = vec3.cross(vec3.create(), bd, bc)
  const bpObcXnAbc = mixed(bp, bc, nAbc)
  const bpOnBcdXbc = mixed(bp, nBcd, bc)
  if (bpObc >= 0 && cpOcb >= 0 && bpObcXnAbc >= 0 && bpOnBcdXbc >= 0) {
    const t = bpObc / vec3.dot(bc, bc)
    return vec4.set(out, 0.0, 1.0 - t, t, 0.0)
  }

  // check voronoi region of cd edge
  const cpOcdXnAcd = mixed(cp, cd, nAcd)
  const cpOnBcdXcd = mixed(cp, nBcd, cd)
  if (cpOcd >= 0 && dpOdc >= 0 && cpOcdXnAcd >= 0 && cpOnBcdXcd >= 0) {
    const t = cpOcd / vec3.dot(cd, cd)
    return vec4.set(out, 0.0, 0.0, 1.0 - t, t)
  }

  // check voronoi region of bd edge
  const bpOnAbdXbd = mixed(bp, nAbd, bd)
  const bpObdXnBcd = mixed(bp, bd, nBcd)
  if (bpObd >= 0 && dpOdb >= 0 && bpOnAbdXbd >= 0 && bpObdXnBcd >= 0) {
    const t = bpObd / vec3.dot(bd, bd)
    return vec4.set(out, 0.0, 1.0 - t, 0.0, t)
  }

  // find closest point on abc
  if (vec3.dot(nAbc, ap) * vec3.dot(nAbc, ad) <= 0 && apOabXnAbc <= 0 && apOnAbcXac <= 0 && bpObcXnAbc <= 0) {
    let u = Math.abs(mixed(nAbc, bp, cp))
    let v = Math.abs(mixed(nAbc, cp, ap))
    let w = Math.abs(mixed(nAbc, ap, bp))
    const s = u + v + w
    u /= s
    v /= s
    w /= s
    return vec4.set(out, u, v, w, 0.0)
  }

  // find closest point on acd
  if (vec3.dot(nAcd, ap) * vec3.dot(nAcd, ab) <= 0.0 && apOacXnAcd <= 0 && apOnAcdXad <= 0 && cpOcdXnAcd <= 0) {
    let u = Math.abs(mixed(nAcd, cp, dp))
    let v = Math.abs(mixed(nAcd, dp, ap))
    let w = Math.abs(mixed(nAcd, ap, cp))
    const s = u + v + w
    u /= s
    v /= s
    w /= s
    return vec4.set(out, u, 0.0, v, w)
  }

  // find closest point on adb
  if (vec3.dot(nAbd, ap) * vec3.dot(nAbd, ac) <= 0.0 && apOnAbdXab <= 0 && apOadXnAbd <= 0 && bpOnAbdXbd <= 0) {
    let u = Math.abs(mixed(nAbd, dp, bp))
    let v = Math.abs(mixed(nAbd, bp, ap))
    let w = Math.abs(mixed(nAbd, ap, dp))
    const s = u + v + w
    u /= s
    v /= s
    w /= s
    return vec4.set(out, u, w, 0.0, v)
  }

  // find closest point on cbd
  if (vec3.dot(nBcd, cp) * vec3.dot(nBcd, ab) >= 0.0 && bpOnBcdXbc <= 0 && cpOnBcdXcd <= 0 && bpObdXnBcd <= 0) {
    let u = Math.abs(mixed(nBcd, bp, dp))
    let v = Math.abs(mixed(nBcd, dp, cp))
    let w = Math.abs(mixed(nBcd, cp, bp))
    const s = u + v + w
    u /= s
    v /= s
    w /= s
    return vec4.set(out, 0.0, v, u, w)
  }

  // we are in tetrahedron itself, return 'special' indication
  return vec4.set(out, -1.0, -1.0, -1.0, -1.0)
}

export const closestPointToTriangle = (out: vec3, a: vec3, b: vec3, c: vec3, p: vec3): vec3 => {
  const ab = vec3.subtract(vec3.create(), b, a)
  const ac = vec3.subtract(vec3.create(), c, a)
  const bc = vec3.subtract(vec3.create(), c, b)
  const ap = vec3.subtract(vec3.create(), p, a)
  const bp = vec3.subtract(vec3.create(), p, b)
  const cp = vec3.subtract(vec3.create(), p, c)

  // Compute parametric position s for projection P’ of P on AB,
  // P’ = A + s*AB, s = snom/(snom+sdenom)
  const snom = vec3.dot(ap, ab)
  const sdenom = -vec3.dot(bp, ab)

  // Compute parametric position t for projection P’ of P on AC,
  // P’ = A + t*AC, s = tnom/(tnom+tdenom)
  const tnom = vec3.dot(ap, ac)
  const tdenom = -vec3.dot(cp, ac)
  if (snom <= 0.0 && tnom <= 0.0) {
    return vec3.set(out, 1.0, 0.0, 0.0) // Vertex region early out
  }
  // Compute parametric position u for projection P’ of P on BC,
  // P’ = B + u*BC, u = unom/(unom+udenom)
  const unom = vec3.dot(bp, bc)
  const udenom = -vec3.dot(cp, bc)
  if (sdenom <= 0.0 && unom <= 0.0) {
    return vec3.set(out, 0.0, 1.0, 0.0) // Vertex region early out
  }
  if (tdenom <= 0.0 && udenom <= 0.0) {
    return vec3.set(out, 0.0, 0.0, 1.0) // Vertex region early out
  }
  // P is outside (or on) AB if the triple scalar product [N PA PB] <= 0
  const n = vec3.cross(vec3.create(), ab, ac)
  const vc = mixed(n, ap, bp)

  // If P outside AB and within feature region of AB,
  // return projection of P onto AB
  if (vc <= 0.0 && snom >= 0.0 && sdenom >= 0.0) {
    const t = snom / (snom + sdenom)
    return vec3.set(out, 1.0 - t, t, 0.0)
  }

  // P is outside (or on) BC if the triple scalar product [N PB PC] <= 0
  const va = mixed(n, bp, cp)

  // If P outside BC and within feature region of BC,
  // return projection of P onto BC
  if (va <= 0.0 && unom >= 0.0 && udenom >= 0.0) {
    const t = unom / (unom + udenom)
    return vec3.set(out, 0.0, 1.0 - t, t)
  }

  // P is outside (or on) CA if the triple scalar product [N PC PA] <= 0
  const vb = mixed(n, cp, ap)

  // If P outside CA and within feature region of CA,
  // return projection of P onto CA
  if (vb <= 0.0 && tnom >= 0.0 && tdenom >= 0.0) {
    const t = tnom / (tnom + tdenom)
    return vec3.set(out, 1.0 - t, 0.0, t)
  }

  // P must project inside face region. Compute Q using barycentric coordinates
  const u = va / (va + vb + vc)
  const v = vb / (va + vb + vc)
  const w = 1.0 - u - v // = vc / (va + vb + vc)

  return vec3.set(out, u, v, w)
}

export const closestPointToLineSegment = (out: vec2, a: vec3, b: vec3, p: vec3): vec2 => {
  const ab = vec3.sub(vec3.create(), b, a)
  const ap = vec3.sub(vec3.create(), p, a)

  // Project c onto ab, computing parameterized position d(t)=a+ t*(b – a)
  let t = vec3.dot(ap, ab) / vec3.dot(ab, ab)

  // If outside segment, clamp t (and therefore d) to the closest endpoint
  if (t < 0.0) {
    t = 0.0
  }
  if (t > 1.0) {
    t = 1.0
  }

  return vec2.set(out, 1.0 - t, t)
}

export const closestPointOnPlane = (out: vec3, p0: vec3, p1: vec3, p2: vec3, w: vec3) => {
  const a = vec3.create()
  vec3.subtract(a, p1, p0)
  vec3.subtract(out, p2, p0)
  vec3.cross(out, a, out)
  vec3.sub(a, w, p0)
  vec3.scaleAndAdd(out, w, out, -vec3.dot(out, a) / vec3.dot(out, out))
}

export const isInsideTriangle = (barycentric: vec3): boolean =>
  barycentric[0] < 0.0 || barycentric[1] < 0.0 || barycentric[2] < 0.0 ? false : true

export const projectToTriangle = (out: vec3, a: vec3, b: vec3, c: vec3, p: vec3) => {
  const n = vec3.create()
  const q = vec3.create()
  const r = vec3.create()
  const t = vec3.create()
  vec3.subtract(q, b, a)
  vec3.subtract(r, c, a)
  vec3.cross(n, q, r)

  // c
  vec3.subtract(q, a, p)
  vec3.subtract(r, b, p)
  vec3.cross(out, q, r)
  const wc = vec3.dot(n, out)

  // a
  vec3.subtract(t, c, p)
  vec3.cross(out, r, t)
  const wa = vec3.dot(n, out)

  // b
  vec3.cross(out, t, q)
  const wb = vec3.dot(n, out)

  const denom = wa + wb + wc
  vec3.set(out, wa / denom, wb / denom, wc / denom)
}

export const createTetrahedron = (w0: SupportPoint, w1: SupportPoint, w2: SupportPoint, w3: SupportPoint): Polytop => {
  const w1w0 = vec3.create()
  const w2w0 = vec3.create()

  vec3.subtract(w1w0, w1.diff, w0.diff)
  vec3.subtract(w2w0, w2.diff, w0.diff)

  const x = vec3.create()
  vec3.cross(x, w2w0, w1w0)

  const w3w0 = vec3.create()
  vec3.subtract(w3w0, w3.diff, w0.diff)

  // preserve ccw orientation: swap w1 and w2
  if (vec3.dot(w3w0, x) > 0.0) {
    const tmp = w2
    w2 = w1
    w1 = tmp
  }

  const face0: Face = {
    vertices: [w0, w1, w3],
    siblings: null,
    adjacent: null,
    distance: 0.0,
    closest: vec3.create(),
    closestBary: vec3.create(),
    obsolete: false
  }

  const face1: Face = {
    vertices: [w1, w2, w3],
    siblings: null,
    adjacent: null,
    distance: 0.0,
    closest: vec3.create(),
    closestBary: vec3.create(),
    obsolete: false
  }

  const face2: Face = {
    vertices: [w2, w0, w3],
    siblings: null,
    adjacent: null,
    distance: 0.0,
    closest: vec3.create(),
    closestBary: vec3.create(),
    obsolete: false
  }

  const face3: Face = {
    vertices: [w1, w0, w2],
    siblings: null,
    adjacent: null,
    distance: 0.0,
    closest: vec3.create(),
    closestBary: vec3.create(),
    obsolete: false
  }

  face0.siblings = [face3, face1, face2]
  face1.siblings = [face3, face2, face0]
  face2.siblings = [face3, face0, face1]
  face3.siblings = [face0, face2, face1]

  face0.adjacent = [0, 2, 1]
  face1.adjacent = [2, 2, 1]
  face2.adjacent = [1, 2, 1]
  face3.adjacent = [0, 0, 0]

  const queue = new PriorityQueue<Face>((a: Face, b: Face) => a.distance - b.distance)

  for (const face of [face0, face1, face2, face3]) {
    projectToTriangle(face.closestBary, face.vertices[0].diff, face.vertices[1].diff, face.vertices[2].diff, origin)
    fromBarycentric(face.closest, face.closestBary, face.vertices[0].diff, face.vertices[1].diff, face.vertices[2].diff)
    face.distance = vec3.dot(face.closest, face.closest)

    queue.enqueue(face)
  }

  return queue
}

export const createHexahedronFromTriangle = (w0: SupportPoint, w1: SupportPoint, w2: SupportPoint, shape: ShapeInterface<SupportPoint>) => {
  const n = vec3.create()
  const vw3 = vec3.create()
  const vw4 = vec3.create()

  vec3.subtract(vw3, w1.diff, w0.diff)
  vec3.subtract(vw4, w2.diff, w0.diff)
  vec3.cross(n, vw3, vw4)

  const w3 = shape.support(
    {
      support0: vec3.create(),
      support1: vec3.create(),
      diff: vec3.create()
    },
    n
  )

  vec3.negate(n, n)

  const w4 = shape.support(
    {
      support0: vec3.create(),
      support1: vec3.create(),
      diff: vec3.create()
    },
    n
  )

  const face0: Face = {
    vertices: [w0, w1, w3],
    siblings: null,
    adjacent: null,
    distance: 0.0,
    closest: vec3.create(),
    closestBary: vec3.create(),
    obsolete: false
  }

  const face1: Face = {
    vertices: [w1, w2, w3],
    siblings: null,
    adjacent: null,
    distance: 0.0,
    closest: vec3.create(),
    closestBary: vec3.create(),
    obsolete: false
  }

  const face2: Face = {
    vertices: [w2, w0, w3],
    siblings: null,
    adjacent: null,
    distance: 0.0,
    closest: vec3.create(),
    closestBary: vec3.create(),
    obsolete: false
  }

  const face3: Face = {
    vertices: [w0, w4, w1],
    siblings: null,
    adjacent: null,
    distance: 0.0,
    closest: vec3.create(),
    closestBary: vec3.create(),
    obsolete: false
  }

  const face4: Face = {
    vertices: [w1, w4, w2],
    siblings: null,
    adjacent: null,
    distance: 0.0,
    closest: vec3.create(),
    closestBary: vec3.create(),

    obsolete: false
  }

  const face5: Face = {
    vertices: [w2, w4, w0],
    siblings: null,
    adjacent: null,
    distance: 0.0,
    closest: vec3.create(),
    closestBary: vec3.create(),
    obsolete: false
  }

  face0.siblings = [face3, face1, face2]
  face1.siblings = [face4, face2, face0]
  face2.siblings = [face5, face0, face1]
  face3.siblings = [face5, face4, face0]
  face4.siblings = [face3, face5, face1]
  face5.siblings = [face4, face3, face2]

  face0.adjacent = [2, 2, 1]
  face1.adjacent = [2, 2, 1]
  face2.adjacent = [2, 2, 1]
  face3.adjacent = [1, 0, 0]
  face4.adjacent = [1, 0, 0]
  face5.adjacent = [1, 0, 0]

  const queue = new PriorityQueue<Face>((a: Face, b: Face) => a.distance - b.distance)

  for (const face of [face0, face1, face2, face3, face4, face5]) {
    projectToTriangle(face.closestBary, face.vertices[0].diff, face.vertices[1].diff, face.vertices[2].diff, origin)
    fromBarycentric(face.closest, face.closestBary, face.vertices[0].diff, face.vertices[1].diff, face.vertices[2].diff)
    face.distance = vec3.dot(face.closest, face.closest)
    queue.enqueue(face)
  }

  return queue
}

export const createHexahedronFromLineSegment = (w3: SupportPoint, w4: SupportPoint, shape: ShapeInterface<SupportPoint>) => {
  const w3w4 = vec3.create()
  vec3.subtract(w3w4, w3.diff, w4.diff)

  // find convenient axis
  let min = Math.abs(w3w4[0])
  const axis = vec3.fromValues(1.0, 0.0, 0.0)
  if (Math.abs(w3w4[1]) < min) {
    min = Math.abs(w3w4[1])
    vec3.set(axis, 0.0, 1.0, 0.0)
  }
  if (Math.abs(w3w4[2]) < min) {
    vec3.set(axis, 0.0, 0.0, 1.0)
  }

  // find w0 by cross product
  const vw0 = vec3.create()
  vec3.cross(vw0, w3w4, axis)
  const w0 = shape.support(
    {
      support0: vec3.create(),
      support1: vec3.create(),
      diff: vec3.create()
    },
    vw0
  )

  const angle = Math.PI / 3.0
  vec3.scale(w3w4, w3w4, Math.sin(angle) / vec3.length(w3w4))
  const q = quat.fromValues(w3w4[0], w3w4[1], w3w4[2], Math.cos(angle))

  // find w1 and w2 by repeatedly rotation at 120 degrees
  const vw1 = vec3.create()
  vec3.transformQuat(vw1, vw0, q)
  const w1 = shape.support(
    {
      support0: vec3.create(),
      support1: vec3.create(),
      diff: vec3.create()
    },
    vw1
  )

  const vw2 = vec3.create()
  vec3.transformQuat(vw2, vw1, q)
  const w2 = shape.support(
    {
      support0: vec3.create(),
      support1: vec3.create(),
      diff: vec3.create()
    },
    vw2
  )

  const face0: Face = {
    vertices: [w0, w1, w3],
    siblings: null,
    adjacent: null,
    distance: 0.0,
    closest: vec3.create(),
    closestBary: vec3.create(),
    obsolete: false
  }

  const face1: Face = {
    vertices: [w1, w2, w3],
    siblings: null,
    adjacent: null,
    distance: 0.0,
    closest: vec3.create(),
    closestBary: vec3.create(),
    obsolete: false
  }

  const face2: Face = {
    vertices: [w2, w0, w3],
    siblings: null,
    adjacent: null,
    distance: 0.0,
    closest: vec3.create(),
    closestBary: vec3.create(),
    obsolete: false
  }

  const face3: Face = {
    vertices: [w0, w4, w1],
    siblings: null,
    adjacent: null,
    distance: 0.0,
    closest: vec3.create(),
    closestBary: vec3.create(),
    obsolete: false
  }

  const face4: Face = {
    vertices: [w1, w4, w2],
    siblings: null,
    adjacent: null,
    distance: 0.0,
    closest: vec3.create(),
    closestBary: vec3.create(),
    obsolete: false
  }

  const face5: Face = {
    vertices: [w2, w4, w0],
    siblings: null,
    adjacent: null,
    distance: 0.0,
    closest: vec3.create(),
    closestBary: vec3.create(),
    obsolete: false
  }

  face0.siblings = [face3, face1, face2]
  face1.siblings = [face4, face2, face0]
  face2.siblings = [face5, face0, face1]
  face3.siblings = [face5, face4, face0]
  face4.siblings = [face3, face5, face1]
  face5.siblings = [face4, face3, face2]

  face0.adjacent = [2, 2, 1]
  face1.adjacent = [2, 2, 1]
  face2.adjacent = [2, 2, 1]
  face3.adjacent = [1, 0, 0]
  face4.adjacent = [1, 0, 0]
  face5.adjacent = [1, 0, 0]

  const queue = new PriorityQueue<Face>((a: Face, b: Face) => a.distance - b.distance)

  for (const face of [face0, face1, face2, face3, face4, face5]) {
    projectToTriangle(face.closestBary, face.vertices[0].diff, face.vertices[1].diff, face.vertices[2].diff, origin)
    fromBarycentric(face.closest, face.closestBary, face.vertices[0].diff, face.vertices[1].diff, face.vertices[2].diff)
    face.distance = vec3.dot(face.closest, face.closest)
    queue.enqueue(face)
  }

  return queue
}

export const checkAdjacency = <T>(polytop: Polytop<T>) => {
  for (const face of Array.from(polytop)) {
    for (let i = 0; i < 3; i++) {
      const that = face.siblings[i].siblings[face.adjacent[i]]
      if (that !== face) {
        console.log(i, face, that)
      }
    }
  }
}

export const getSilhouette = <T>(out: Silhouette<T>, face: Face<T>, i: number, support: vec3, eps = 1.0e-5) => {
  if (face.obsolete) {
    return
  }

  if (vec3.dot(face.closest, support) + eps < vec3.dot(face.closest, face.closest)) {
    // not visible from support point, add to silhouette
    out.push([face, i])
  } else {
    face.obsolete = true

    getSilhouette(out, face.siblings[(i + 1) % 3], face.adjacent[(i + 1) % 3], support)
    getSilhouette(out, face.siblings[(i + 2) % 3], face.adjacent[(i + 2) % 3], support)
  }
}
