import { mat4, quat, vec3 } from 'gl-matrix'
import { Entity } from './entity'

export class Transform {
  public position: vec3
  public rotation: vec3
  public scale: vec3
  public entity: Entity
  public localMatrix: mat4
  public worldMatrix: mat4

  constructor(entity: Entity) {
    this.entity = entity
    this.position = vec3.create()
    this.rotation = vec3.create()
    this.scale = vec3.fromValues(1, 1, 1)
    this.localMatrix = mat4.create()
    this.worldMatrix = mat4.create()
  }

  public get parentTransform(): Transform | null {
    return this.entity.parent ? this.entity.parent.transform : null
  }

  public get worldPosition(): vec3 {
    return mat4.getTranslation([0, 0, 0], this.worldMatrix)
  }

  public get worldRotation(): vec3 {
    return this.parentTransform ? vec3.add([0, 0, 0], this.parentTransform.worldRotation, this.rotation) : this.rotation
  }

  public get worldScale(): vec3 {
    return this.parentTransform ? vec3.multiply([0, 0, 0], this.parentTransform.worldScale, this.scale) : this.scale
  }

  public getMatrix(destination: mat4): mat4 {
    return mat4.fromRotationTranslationScale(
      destination,
      quat.fromEuler([0, 0, 0, 0], this.rotation[0], this.rotation[1], this.rotation[2]),
      this.position,
      this.scale
    )
  }

  public updateWorldMatrix(matrix?: mat4) {
    this.localMatrix = this.getMatrix(this.localMatrix)

    if (matrix) {
      mat4.multiply(this.worldMatrix, matrix, this.localMatrix)
    } else {
      mat4.copy(this.worldMatrix, this.localMatrix)
    }

    this.entity.children.forEach((child) => {
      child.transform.updateWorldMatrix(this.worldMatrix)
    })
  }

  public lookAt(target: vec3) {
    const direction = vec3.subtract([0, 0, 0], target, this.position)
    const rotation = vec3.fromValues(
      Math.atan2(direction[1], direction[2]),
      Math.atan2(-direction[0], Math.sqrt(direction[1] * direction[1] + direction[2] * direction[2])),
      0
    )
    vec3.copy(this.rotation, rotation)
  }

  public translate(translation: vec3) {
    vec3.add(this.position, this.position, translation)
  }

  public rotate(rotation: vec3) {
    vec3.add(this.rotation, this.rotation, rotation)
  }

  public scaleBy(scale: vec3) {
    vec3.multiply(this.scale, this.scale, scale)
  }

  public getForwardVector(): vec3 {
    const rotation = quat.fromEuler([0, 0, 0, 0], this.rotation[0], this.rotation[1], this.rotation[2])
    const forward = vec3.fromValues(0, 0, 1)
    vec3.transformQuat(forward, forward, rotation)
    return forward
  }

  public getRightVector(): vec3 {
    const rotation = quat.fromEuler([0, 0, 0, 0], this.rotation[0], this.rotation[1], this.rotation[2])
    const right = vec3.fromValues(1, 0, 0)
    vec3.transformQuat(right, right, rotation)
    return right
  }

  public getUpVector(): vec3 {
    const rotation = quat.fromEuler([0, 0, 0, 0], this.rotation[0], this.rotation[1], this.rotation[2])
    const up = vec3.fromValues(0, 1, 0)
    vec3.transformQuat(up, up, rotation)
    return up
  }

  public getForwardVectorWorld(): vec3 {
    const rotation = quat.fromEuler([0, 0, 0, 0], this.worldRotation[0], this.worldRotation[1], this.worldRotation[2])
    const forward = vec3.fromValues(0, 0, 1)
    vec3.transformQuat(forward, forward, rotation)
    return forward
  }

  public getRightVectorWorld(): vec3 {
    const rotation = quat.fromEuler([0, 0, 0, 0], this.worldRotation[0], this.worldRotation[1], this.worldRotation[2])
    const right = vec3.fromValues(1, 0, 0)
    vec3.transformQuat(right, right, rotation)
    return right
  }

  public getUpVectorWorld(): vec3 {
    const rotation = quat.fromEuler([0, 0, 0, 0], this.worldRotation[0], this.worldRotation[1], this.worldRotation[2])
    const up = vec3.fromValues(0, 1, 0)
    vec3.transformQuat(up, up, rotation)
    return up
  }
}
