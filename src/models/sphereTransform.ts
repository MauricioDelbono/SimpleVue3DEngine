import { mat4, quat, vec3 } from 'gl-matrix'
import { Transform } from './transform'

export class SphereTransform extends Transform {
  private modifiedMatrix = mat4.create()
  private tempPosition = vec3.create()
  private tempRotation = quat.create()
  private tempScale = vec3.create()

  constructor() {
    super()
  }

  public getMatrix(destination: mat4): mat4 {
    return mat4.fromRotationTranslationScale(destination, [0, 0, 0, 0], this.position, this.scale)
  }

  public updateWorldMatrix(matrix?: mat4) {
    this.localMatrix = this.getMatrix(this.localMatrix)

    if (matrix) {
      mat4.getTranslation(this.tempPosition, matrix)
      mat4.getRotation(this.tempRotation, matrix)
      mat4.getScaling(this.tempScale, matrix)
      const maxScale = Math.max(this.tempScale[0], this.tempScale[1], this.tempScale[2])
      this.tempScale = vec3.fromValues(maxScale, maxScale, maxScale)
      mat4.fromRotationTranslationScale(this.modifiedMatrix, this.tempRotation, this.tempPosition, this.tempScale)
      mat4.multiply(this.worldMatrix, this.localMatrix, this.modifiedMatrix)
    } else {
      mat4.copy(this.worldMatrix, this.localMatrix)
    }
  }
}
