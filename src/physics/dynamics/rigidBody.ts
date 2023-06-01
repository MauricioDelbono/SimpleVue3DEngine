import { Component } from '@/models/component'
import { vec3 } from 'gl-matrix'
import { usePhysicsStore } from '@/stores/physics'
import { Collider } from '../collisions/collider'

export class Rigidbody extends Component {
  public mass: number = 1
  public velocity: vec3 = vec3.fromValues(0, 0, 0)
  public acceleration: vec3 = vec3.fromValues(0, 0, 0)
  public force: vec3 = vec3.fromValues(0, 0, 0)
  public isDynamic: boolean = true
  public isTrigger: boolean = false

  constructor() {
    super()
    usePhysicsStore().addObject(this)
  }

  public get position() {
    return this.entity.transform.position
  }

  public get colliders() {
    return this.entity.getComponents(Collider)
  }

  public get isStatic() {
    return !this.isDynamic
  }

  public applyForce(force: vec3) {
    vec3.add(this.force, this.force, force)
  }

  public move(delta: number) {
    delta = delta / 1000
    vec3.scale(this.force, this.force, (1 / this.mass) * delta)
    vec3.add(this.velocity, this.velocity, this.force)
    vec3.scale(this.force, this.velocity, delta)
    vec3.add(this.position, this.position, this.force)

    vec3.set(this.force, 0, 0, 0)
  }
}
