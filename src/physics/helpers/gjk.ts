import { vec3 } from 'gl-matrix'
import { Face } from '../models/face'
import { MinHeap } from '../models/minHeap'
import { CollisionPoints } from '../collisions/collisionPoints'
import type { Shape } from './shape'
import { minkowskiSupport } from './shape'

function signedVolume(p: vec3, q: vec3, r: vec3, s: vec3): number {
  const qp = vec3.subtract(vec3.create(), q, p)
  const rp = vec3.subtract(vec3.create(), r, p)
  const sp = vec3.subtract(vec3.create(), s, p)
  return vec3.dot(qp, vec3.cross(vec3.create(), rp, sp)) / 6
}

function gjk(shapeA: Shape, shapeB: Shape) {
  const simplex: Array<vec3> = []

  // Better initial search direction - use vector between shape centers
  let direction = vec3.create()
  const centerA = shapeA.getCenter()
  const centerB = shapeB.getCenter()
  vec3.subtract(direction, centerB, centerA)

  // Fallback if centers are too close
  if (vec3.length(direction) < 1e-6) {
    vec3.set(direction, 1, 0, 0)
  } else {
    vec3.normalize(direction, direction)
  }

  simplex.push(minkowskiSupport(shapeA, shapeB, direction))
  direction = vec3.negate(vec3.create(), simplex[0])

  // Increased iteration cap for more reliable convergence
  const maxIterations = 64
  let iter = 0
  const epsilon = 1e-6

  while (iter < maxIterations) {
    iter++
    const p = minkowskiSupport(shapeA, shapeB, direction)

    // Improved duplicate point detection
    const isDuplicate = simplex.some((v) => vec3.distance(v, p) < epsilon)
    if (isDuplicate) {
      // If we found a duplicate and haven't detected collision yet, no collision
      return { intersects: false }
    }

    // Check if we're making progress towards the origin
    if (vec3.dot(p, direction) <= epsilon) {
      return { intersects: false }
    }

    simplex.push(p)

    if (simplex.length === 4) {
      if (containsOrigin3D(simplex)) {
        return { intersects: true, simplex } // Collision, return simplex for EPA
      } else {
        return { intersects: false }
      }
    }

    const nextDir = updateSimplex3D(simplex)
    if (!nextDir) {
      return { intersects: true, simplex } // Collision detected
    }
    direction = nextDir
  }

  console.warn('GJK: max iterations reached - potential convergence issue')
  return { intersects: false }
}

function updateSimplex3D(simplex: Array<vec3>) {
  if (simplex.length === 1) {
    return vec3.negate(vec3.create(), simplex[0])
  } else if (simplex.length === 2) {
    const a = simplex[1]
    const b = simplex[0]
    const ab = vec3.subtract(vec3.create(), b, a)
    const ao = vec3.negate(vec3.create(), a)
    const normal = tripleProduct(ab, ao, ab)
    return vec3.normalize(normal, normal)
  } else if (simplex.length === 3) {
    const a = simplex[2]
    const b = simplex[1]
    const c = simplex[0]
    const ab = vec3.subtract(vec3.create(), b, a)
    const ac = vec3.subtract(vec3.create(), c, a)
    const ao = vec3.negate(vec3.create(), a)
    const abcNormal = vec3.cross(vec3.create(), ab, ac)

    // Determine which region to keep
    if (vec3.dot(abcNormal, ao) > 0) {
      if (vec3.dot(ab, ao) > 0) {
        simplex.splice(0, 1) // remove c
        const normal = tripleProduct(ab, ao, ab)
        return vec3.normalize(normal, normal)
      } else if (vec3.dot(ac, ao) > 0) {
        simplex.splice(1, 1) // remove b
        const normal = tripleProduct(ac, ao, ac)
        return vec3.normalize(normal, normal)
      } else {
        simplex.splice(0, 2) // keep only a
        return ao
      }
    } else {
      // origin is on other side of triangle
      const normal = vec3.negate(vec3.create(), abcNormal)
      return vec3.normalize(normal, normal)
    }
  } else {
    // Tetrahedron case
    return null // Let containsOrigin3D handle it
  }
}

function containsOrigin3D(simplex: Array<vec3>) {
  if (simplex.length !== 4) return false
  const [a, b, c, d] = simplex
  const o = vec3.create()

  // Barycentric sub-volume check: origin replaces each vertex in turn;
  // all four sub-volumes must share the same sign when origin is inside.
  const sign1 = Math.sign(signedVolume(o, b, c, d))
  const sign2 = Math.sign(signedVolume(a, o, c, d))
  const sign3 = Math.sign(signedVolume(a, b, o, d))
  const sign4 = Math.sign(signedVolume(a, b, c, o))

  return (sign1 >= 0 && sign2 >= 0 && sign3 >= 0 && sign4 >= 0) ||
         (sign1 <= 0 && sign2 <= 0 && sign3 <= 0 && sign4 <= 0)
}

function tripleProduct(a: vec3, b: vec3, c: vec3): vec3 {
  // Compute (a × b) × c
  const cross1 = vec3.cross(vec3.create(), a, b)
  return vec3.cross(vec3.create(), cross1, c)
}

function epa(shapeA: Shape, shapeB: Shape, initialSimplex: Array<vec3>) {
  // Dynamic epsilon based on shape sizes
  const radiusA = shapeA.getRadius()
  const radiusB = shapeB.getRadius()
  const baseEps = Math.min(radiusA, radiusB) * 1e-4
  const epsilon = Math.min(Math.max(baseEps || 1e-4, 1e-4), 1e-3)

  const vertices = initialSimplex.slice()
  const vertexDirections = [vec3.fromValues(1, 0, 0), ...initialSimplex.map((v) => vec3.negate(vec3.create(), v))] // Track directions for support points
  const faces = [
    new Face([0, 1, 2], vertices),
    new Face([0, 2, 3], vertices),
    new Face([0, 3, 1], vertices),
    new Face([1, 3, 2], vertices)
  ].filter((f) => f.valid)

  // Initialize min-heap
  const heap = new MinHeap()
  faces.forEach((face) => {
    if (face.valid) {
      let dist = face.distance
      if (dist < 0) {
        vec3.negate(face.normal, face.normal)
        dist = -dist
      }
      heap.insert(face, dist)
    }
  })

  const maxIterations = 64
  for (let i = 0; i < maxIterations; i++) {
    // Extract closest face
    const extracted = heap.extractMin()
    if (!extracted || !extracted.face) {
      console.warn('EPA: No valid faces in heap')
      break
    }

    const { face: minFace, distance: minDist } = extracted

    // Add new support point using shape support functions
    const p = minkowskiSupport(shapeA, shapeB, minFace.normal)
    vertexDirections.push(minFace.normal) // Store direction for this support point
    const distToP = vec3.dot(p, minFace.normal)

    // Check convergence with dynamic epsilon
    if (Math.abs(distToP - minDist) < epsilon) {
      return computeContactPoints(shapeA, shapeB, minFace, minDist, vertexDirections, vertices)
    }

    // Robustness: Prevent duplicate points
    const distanceVP = vec3.create()
    const minDistToExisting = vertices.reduce((min, v) => Math.min(min, vec3.length(vec3.subtract(distanceVP, v, p))), Infinity)
    if (minDistToExisting < epsilon) {
      return computeContactPoints(shapeA, shapeB, minFace, minDist, vertexDirections, vertices)
    }

    // Add new point
    vertices.push(p)
    const newPointIndex = vertices.length - 1

    // Find visible faces using adjacency
    const visibleIndices = new Set<number>()
    const toCheck = [faces.indexOf(minFace)]
    while (toCheck.length > 0) {
      const faceIdx = toCheck.pop() ?? 0
      const face = faces[faceIdx]
      if (!visibleIndices.has(faceIdx) && face && face.isVisible(p)) {
        visibleIndices.add(faceIdx)
        face.adjacents.forEach((adjIdx) => {
          if (adjIdx !== -1 && !visibleIndices.has(adjIdx)) {
            toCheck.push(adjIdx)
          }
        })
      }
    }

    // Collect silhouette edges
    const edgeMap = new Map()
    for (const idx of visibleIndices) {
      const face = faces[idx]
      for (let j = 0; j < 3; j++) {
        if (face.adjacents[j] === -1 || !visibleIndices.has(face.adjacents[j])) {
          const a = face.indices[j]
          const b = face.indices[(j + 1) % 3]
          const key = a < b ? `${a}-${b}` : `${b}-${a}`
          edgeMap.set(key, [a, b])
        }
      }
    }

    // Remove visible faces
    for (let j = faces.length - 1; j >= 0; j--) {
      if (visibleIndices.has(j)) {
        faces.splice(j, 1)
      }
    }

    // Create new faces
    const newFaces = []
    for (const [_, [i1, i2]] of edgeMap) {
      const newFace = new Face([i1, i2, newPointIndex], vertices)
      if (newFace.valid) {
        newFaces.push(newFace)
      }
    }

    // Update adjacency for new faces
    for (let i = 0; i < newFaces.length; i++) {
      for (let j = 0; j < faces.length; j++) {
        const shared = sharedEdge(newFaces[i], faces[j])
        if (shared) {
          newFaces[i].adjacents[shared.edgeI] = j
          faces[j].adjacents[shared.edgeJ] = faces.length + i
        }
      }
      for (let j = i + 1; j < newFaces.length; j++) {
        const shared = sharedEdge(newFaces[i], newFaces[j])
        if (shared) {
          newFaces[i].adjacents[shared.edgeI] = faces.length + j
          newFaces[j].adjacents[shared.edgeJ] = faces.length + i
        }
      }
    }

    // Add new faces to heap and array
    newFaces.forEach((face) => {
      let dist = face.distance
      if (dist < 0) {
        vec3.negate(face.normal, face.normal)
        dist = -dist
      }
      heap.insert(face, dist)
      faces.push(face)
    })

    if (newFaces.length === 0) {
      return computeContactPoints(shapeA, shapeB, minFace, minDist, vertexDirections, vertices)
    }
  }

  console.warn('EPA: Max iterations reached, returning approximate result')
  const fallback = heap.extractMin()
  if (!fallback || !fallback.face) {
    // Emergency fallback
    const centerA = shapeA.getCenter()
    const centerB = shapeB.getCenter()
    const normal = vec3.subtract(vec3.create(), centerB, centerA)
    if (vec3.length(normal) < 1e-6) {
      vec3.set(normal, 0, 1, 0)
    } else {
      vec3.normalize(normal, normal)
    }
    return new CollisionPoints(centerA, centerB, normal, 0.1)
  }
  return computeContactPoints(shapeA, shapeB, fallback.face, fallback.distance, vertexDirections, vertices)
}

function sharedEdge(face1: Face, face2: Face) {
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const a1 = face1.indices[i]
      const b1 = face1.indices[(i + 1) % 3]
      const a2 = face2.indices[j]
      const b2 = face2.indices[(j + 1) % 3]
      if ((a1 === a2 && b1 === b2) || (a1 === b2 && b1 === a2)) {
        return { edgeI: i, edgeJ: j }
      }
    }
  }
  return null
}

function triangleArea(p1: vec3, p2: vec3, p3: vec3): number {
  return 0.5 * vec3.length(vec3.cross(vec3.create(), vec3.subtract(vec3.create(), p2, p1), vec3.subtract(vec3.create(), p3, p1)))
}

function computeContactPoints(
  shapeA: Shape,
  shapeB: Shape,
  closestFace: Face,
  depth: number,
  vertexDirections: Array<vec3>,
  vertices: Array<vec3>
) {
  const indices = closestFace.indices
  const v1 = vertices[indices[0]]
  const v2 = vertices[indices[1]]
  const v3 = vertices[indices[2]]
  const totalArea = triangleArea(v1, v2, v3)
  const q = vec3.scale(vec3.create(), closestFace.normal, depth)
  const area1 = triangleArea(q, v2, v3)
  const area2 = triangleArea(q, v3, v1)
  const area3 = triangleArea(q, v1, v2)
  const bary = [area1 / totalArea, area2 / totalArea, area3 / totalArea]
  const d1 = vertexDirections[indices[0]]
  const d2 = vertexDirections[indices[1]]
  const d3 = vertexDirections[indices[2]]

  // Get contact points on each shape using their support functions
  const a1 = shapeA.support(d1)
  const b1 = shapeB.support(vec3.negate(vec3.create(), d1))
  const a2 = shapeA.support(d2)
  const b2 = shapeB.support(vec3.negate(vec3.create(), d2))
  const a3 = shapeA.support(d3)
  const b3 = shapeB.support(vec3.negate(vec3.create(), d3))

  const contactA = vec3.create()
  vec3.scaleAndAdd(contactA, contactA, a1, bary[0])
  vec3.scaleAndAdd(contactA, contactA, a2, bary[1])
  vec3.scaleAndAdd(contactA, contactA, a3, bary[2])
  const contactB = vec3.create()
  vec3.scaleAndAdd(contactB, contactB, b1, bary[0])
  vec3.scaleAndAdd(contactB, contactB, b2, bary[1])
  vec3.scaleAndAdd(contactB, contactB, b3, bary[2])

  // Ensure normal points from A to B
  const normal = vec3.copy(vec3.create(), closestFace.normal)
  const centerToCenter = vec3.subtract(vec3.create(), contactB, contactA)
  if (vec3.dot(normal, centerToCenter) < 0) {
    vec3.negate(normal, normal)
  }

  return new CollisionPoints(contactA, contactB, normal, depth)
}

export { gjk, epa }
