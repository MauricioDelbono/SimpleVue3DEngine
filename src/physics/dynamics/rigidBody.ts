import { Component } from '@/models/component'
import { vec3 } from 'gl-matrix'
import { Collider } from '../collisions/collider'

export class Rigidbody extends Component {
  public mass: number = 1
  public velocity: vec3 = vec3.fromValues(0, 0, 0)
  public acceleration: vec3 = vec3.fromValues(0, 0, 0)
  public force: vec3 = vec3.fromValues(0, 0, 0)
  public isDynamic: boolean = true
  public isTrigger: boolean = false

  public get position() {
    return this.entity.transform.position
  }

  public get colliders() {
    return this.entity.getComponents(Collider)
  }

  public applyForce(force: vec3) {
    vec3.add(this.force, this.force, force)
  }

  public move(delta: number) {
    vec3.add(this.velocity, this.velocity, vec3.scale(this.force, this.force, 1 / (this.mass * delta)))
    vec3.add(this.position, this.position, vec3.scale(this.velocity, this.velocity, delta))

    vec3.set(this.force, 0, 0, 0)
  }
}
