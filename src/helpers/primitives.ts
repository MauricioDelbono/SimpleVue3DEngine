import { Mesh } from '@/models/mesh'
import { useWebGLStore } from '@/stores/webgl'

export default class Primitives {
  static createMeshVAO(mesh: Mesh, numberOfComponents: number = 3) {
    const { gl, pipelines } = useWebGLStore()
    gl.useProgram(pipelines.default.program)
    const vao = gl.createVertexArray()
    gl.bindVertexArray(vao)

    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.positions), gl.STATIC_DRAW)
    const normalBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.normals), gl.STATIC_DRAW)
    const textureCoordsBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordsBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(mesh.textureCoords), gl.STATIC_DRAW)
    const indicesBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indices), gl.STATIC_DRAW)

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.vertexAttribPointer(pipelines.default.attributes.positionLoc, numberOfComponents, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(pipelines.default.attributes.positionLoc)
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
    gl.vertexAttribPointer(pipelines.default.attributes.normalLoc, numberOfComponents, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(pipelines.default.attributes.normalLoc)
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordsBuffer)
    gl.vertexAttribPointer(pipelines.default.attributes.textureCoordsLoc, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(pipelines.default.attributes.textureCoordsLoc)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer)

    gl.bindVertexArray(null)

    return vao
  }

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

    const cube = new Mesh(positions, normals, textureCoords, indices)
    cube.vao = this.createMeshVAO(cube)

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

    const plane = new Mesh(positions, normals, textureCoords, indices)
    plane.vao = this.createMeshVAO(plane)
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

    const sphere = new Mesh(positions, normals, textureCoords, indices)
    sphere.vao = this.createMeshVAO(sphere)
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

    const cone = new Mesh(positions, normals, textureCoords, indices)
    cone.vao = this.createMeshVAO(cone)
    return cone
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

    const quad = new Mesh(positions, normals, textureCoords, indices)
    // quad.vao = this.createMeshVAO(quad, 2)
    return quad
  }
}
