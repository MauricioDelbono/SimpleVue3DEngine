import { vec3 } from 'gl-matrix'

function support(shapeA: Array<vec3>, shapeB: Array<vec3>, direction: vec3) {
  const directionNegated = vec3.negate(vec3.create(), direction)
  if (shapeA.length && shapeB.length) {
    const a = shapeA.reduce((max, v) => (vec3.dot(v, direction) > vec3.dot(max, direction) ? v : max), shapeA[0])
    const b = shapeB.reduce((max, v) => (vec3.dot(v, directionNegated) > vec3.dot(max, directionNegated) ? v : max), shapeB[0])
    const result = vec3.create()
    vec3.subtract(result, a, b)
    return result
  } else if (shapeA.length) {
    return shapeA.reduce((max, v) => (vec3.dot(v, direction) > vec3.dot(max, direction) ? v : max), shapeA[0])
  } else {
    return shapeB.reduce((max, v) => (vec3.dot(v, directionNegated) > vec3.dot(max, directionNegated) ? v : max), shapeB[0])
  }
}

// For simplex direction calculation
function tripleProduct(a: vec3, b: vec3, c: vec3) {
  const result = vec3.create()
  vec3.cross(result, a, b)
  vec3.cross(result, result, c)
  return result
}

export { support, tripleProduct }
