import { Mesh } from '@/models/mesh'

export default class Primitives {
  static createCube(): Mesh {
    const positions = [
      1, 1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1, -1, 1, -1, 1, 1, 1, 1, 1, 1, 1, -1, -1, 1, -1, -1, -1,
      -1, 1, -1, -1, 1, -1, 1, -1, -1, 1, 1, 1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1, -1, 1, -1, 1, 1, -1, 1, -1, -1, -1, -1, -1
    ]
    const normals = [
      1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0,
      -1, 0, 0, -1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1
    ]
    const textureCoords = [
      1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0,
      1, 1, 1
    ]
    const indices = [
      0, 1, 2, 0, 2, 3, 4, 5, 6, 4, 6, 7, 8, 9, 10, 8, 10, 11, 12, 13, 14, 12, 14, 15, 16, 17, 18, 16, 18, 19, 20, 21, 22, 20, 22, 23
    ]

    const cube = new Mesh('Cube', positions, normals, textureCoords, indices)
    return cube
  }

  static createPlane(width: number = 20, depth: number = 20, subdivisionsWidth: number = 1, subdivisionsDepth: number = 1): Mesh {
    width = width || 1
    depth = depth || 1
    subdivisionsWidth = subdivisionsWidth || 1
    subdivisionsDepth = subdivisionsDepth || 1

    const positions = []
    const normals = []
    const textureCoords = []

    for (let z = 0; z <= subdivisionsDepth; z++) {
      for (let x = 0; x <= subdivisionsWidth; x++) {
        const u = x / subdivisionsWidth
        const v = z / subdivisionsDepth
        positions.push(width * u - width * 0.5, 0, depth * v - depth * 0.5)
        normals.push(0, 1, 0)
        textureCoords.push(u, v)
      }
    }

    const numVertsAcross = subdivisionsWidth + 1
    const indices = []

    for (let z = 0; z < subdivisionsDepth; z++) {
      // eslint-disable-line
      for (let x = 0; x < subdivisionsWidth; x++) {
        // eslint-disable-line
        // Make triangle 1 of quad.
        indices.push((z + 0) * numVertsAcross + x, (z + 1) * numVertsAcross + x, (z + 0) * numVertsAcross + x + 1)

        // Make triangle 2 of quad.
        indices.push((z + 1) * numVertsAcross + x, (z + 1) * numVertsAcross + x + 1, (z + 0) * numVertsAcross + x + 1)
      }
    }

    const plane = new Mesh('Plane', positions, normals, textureCoords, indices)
    return plane
  }

  static createSphere(
    radius: number = 1,
    subdivisionsAxis: number = 20,
    subdivisionsHeight: number = 20,
    startLatitudeInRadians?: number,
    endLatitudeInRadians?: number,
    startLongitudeInRadians?: number,
    endLongitudeInRadians?: number
  ): Mesh {
    if (subdivisionsAxis <= 0 || subdivisionsHeight <= 0) {
      throw new Error('subdivisionAxis and subdivisionHeight must be > 0')
    }

    startLatitudeInRadians = startLatitudeInRadians || 0
    endLatitudeInRadians = endLatitudeInRadians || Math.PI
    startLongitudeInRadians = startLongitudeInRadians || 0
    endLongitudeInRadians = endLongitudeInRadians || Math.PI * 2

    const latRange = endLatitudeInRadians - startLatitudeInRadians
    const longRange = endLongitudeInRadians - startLongitudeInRadians

    // We are going to generate our sphere by iterating through its
    // spherical coordinates and generating 2 triangles for each quad on a
    // ring of the sphere.
    const positions = []
    const normals = []
    const textureCoords = []

    // Generate the individual vertices in our vertex buffer.
    for (let y = 0; y <= subdivisionsHeight; y++) {
      for (let x = 0; x <= subdivisionsAxis; x++) {
        // Generate a vertex based on its spherical coordinates
        const u = x / subdivisionsAxis
        const v = y / subdivisionsHeight
        const theta = longRange * u + startLongitudeInRadians
        const phi = latRange * v + startLatitudeInRadians
        const sinTheta = Math.sin(theta)
        const cosTheta = Math.cos(theta)
        const sinPhi = Math.sin(phi)
        const cosPhi = Math.cos(phi)
        const ux = cosTheta * sinPhi
        const uy = cosPhi
        const uz = sinTheta * sinPhi
        positions.push(radius * ux, radius * uy, radius * uz)
        normals.push(ux, uy, uz)
        textureCoords.push(1 - u, v)
      }
    }

    const numVertsAround = subdivisionsAxis + 1
    const indices = []
    for (let x = 0; x < subdivisionsAxis; x++) {
      for (let y = 0; y < subdivisionsHeight; y++) {
        // Make triangle 1 of quad.
        indices.push((y + 0) * numVertsAround + x, (y + 0) * numVertsAround + x + 1, (y + 1) * numVertsAround + x)

        // Make triangle 2 of quad.
        indices.push((y + 1) * numVertsAround + x, (y + 0) * numVertsAround + x + 1, (y + 1) * numVertsAround + x + 1)
      }
    }

    const sphere = new Mesh('Sphere', positions, normals, textureCoords, indices)
    return sphere
  }

  static createTruncatedCone(
    bottomRadius: number = 1,
    topRadius: number = 0,
    height: number = 2,
    radialSubdivisions: number = 20,
    verticalSubdivisions: number = 1,
    hasTopCap: boolean = true,
    hasBottomCap: boolean = true
  ): Mesh {
    if (radialSubdivisions < 3) {
      throw new Error('radialSubdivisions must be 3 or greater')
    }

    if (verticalSubdivisions < 1) {
      throw new Error('verticalSubdivisions must be 1 or greater')
    }

    const extra = (hasTopCap ? 2 : 0) + (hasBottomCap ? 2 : 0)

    const positions = []
    const normals = []
    const textureCoords = []
    const indices = []

    const vertsAroundEdge = radialSubdivisions + 1

    // The slant of the cone is constant across its surface
    const slant = Math.atan2(bottomRadius - topRadius, height)
    const cosSlant = Math.cos(slant)
    const sinSlant = Math.sin(slant)

    const start = hasTopCap ? -2 : 0
    const end = verticalSubdivisions + (hasBottomCap ? 2 : 0)

    for (let yy = start; yy <= end; ++yy) {
      let v = yy / verticalSubdivisions
      let y = height * v
      let ringRadius
      if (yy < 0) {
        y = 0
        v = 1
        ringRadius = bottomRadius
      } else if (yy > verticalSubdivisions) {
        y = height
        v = 1
        ringRadius = topRadius
      } else {
        ringRadius = bottomRadius + (topRadius - bottomRadius) * (yy / verticalSubdivisions)
      }
      if (yy === -2 || yy === verticalSubdivisions + 2) {
        ringRadius = 0
        v = 0
      }
      y -= height / 2
      for (let ii = 0; ii < vertsAroundEdge; ++ii) {
        const sin = Math.sin((ii * Math.PI * 2) / radialSubdivisions)
        const cos = Math.cos((ii * Math.PI * 2) / radialSubdivisions)
        positions.push(sin * ringRadius, y, cos * ringRadius)
        if (yy < 0) {
          normals.push(0, -1, 0)
        } else if (yy > verticalSubdivisions) {
          normals.push(0, 1, 0)
        } else if (ringRadius === 0.0) {
          normals.push(0, 0, 0)
        } else {
          normals.push(sin * cosSlant, sinSlant, cos * cosSlant)
        }
        textureCoords.push(ii / radialSubdivisions, 1 - v)
      }
    }

    for (let yy = 0; yy < verticalSubdivisions + extra; ++yy) {
      if ((yy === 1 && hasTopCap) || (yy === verticalSubdivisions + extra - 2 && hasBottomCap)) {
        continue
      }
      for (let ii = 0; ii < radialSubdivisions; ++ii) {
        indices.push(vertsAroundEdge * (yy + 0) + 0 + ii, vertsAroundEdge * (yy + 0) + 1 + ii, vertsAroundEdge * (yy + 1) + 1 + ii)
        indices.push(vertsAroundEdge * (yy + 0) + 0 + ii, vertsAroundEdge * (yy + 1) + 1 + ii, vertsAroundEdge * (yy + 1) + 0 + ii)
      }
    }

    const cone = new Mesh('TCone', positions, normals, textureCoords, indices)
    return cone
  }

  static createTorus(slices: number = 8, loops: number = 20, inner_rad: number = 0.5, outerRad: number = 2) {
    const positions = []
    const indices = []
    const normals = []
    const textureCoords = []

    for (let slice = 0; slice <= slices; ++slice) {
      const v = slice / slices
      const slice_angle = v * 2 * Math.PI
      const cos_slices = Math.cos(slice_angle)
      const sin_slices = Math.sin(slice_angle)
      const slice_rad = outerRad + inner_rad * cos_slices

      for (let loop = 0; loop <= loops; ++loop) {
        const u = loop / loops
        const loop_angle = u * 2 * Math.PI
        const cos_loops = Math.cos(loop_angle)
        const sin_loops = Math.sin(loop_angle)

        const x = slice_rad * cos_loops
        const y = slice_rad * sin_loops
        const z = inner_rad * sin_slices

        positions.push(x, y, z)
        normals.push(cos_loops * sin_slices, sin_loops * sin_slices, cos_slices)

        textureCoords.push(u)
        textureCoords.push(v)
      }
    }

    const vertsPerSlice = loops + 1
    for (let i = 0; i < slices; ++i) {
      let v1 = i * vertsPerSlice
      let v2 = v1 + vertsPerSlice

      for (let j = 0; j < loops; ++j) {
        indices.push(v1)
        indices.push(v1 + 1)
        indices.push(v2)

        indices.push(v2)
        indices.push(v1 + 1)
        indices.push(v2 + 1)

        v1 += 1
        v2 += 1
      }
    }

    const torus = new Mesh('Torus', positions, normals, textureCoords, indices)
    return torus
  }

  static createXYQuad(size: number = 2, xOffset: number = 0, yOffset: number = 0): Mesh {
    size *= 0.5
    const positions = [
      xOffset + -1 * size,
      yOffset + -1 * size,
      xOffset + 1 * size,
      yOffset + -1 * size,
      xOffset + -1 * size,
      yOffset + 1 * size,
      xOffset + 1 * size,
      yOffset + 1 * size
    ]
    const normals = [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]
    const textureCoords = [0, 0, 1, 0, 0, 1, 1, 1]
    const indices = [0, 1, 2, 2, 1, 3]

    const quad = new Mesh('Quad', positions, normals, textureCoords, indices)
    return quad
  }
}
