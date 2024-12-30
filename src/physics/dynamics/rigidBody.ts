import { Component } from '@/models/component'
import { vec3 } from 'gl-matrix'
import { usePhysicsStore } from '@/stores/physics'
import { Collider } from '../collisions/collider'
import type { Time } from '@/models/time'

export class Rigidbody extends Component {
  public mass: number = 1
  public restitution: number = 1
  public velocity: vec3 = vec3.fromValues(0, 0, 0)
  public acceleration: vec3 = vec3.fromValues(0, 0, 0)
  public force: vec3 = vec3.fromValues(0, 0, 0)
  public angularVelocity: vec3 = vec3.fromValues(0, 0, 0)
  public torque: vec3 = vec3.fromValues(0, 0, 0)
  public isDynamic: boolean = true
  public isTrigger: boolean = false

  constructor() {
    super()
    usePhysicsStore().addObject(this)
  }

  public get position() {
    return this.entity.transform.position
  }

  public get rotation() {
    return this.entity.transform.rotation
  }

  public get inverseMass() {
    return 1 / this.mass
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

  public applyTorque(torque: vec3) {
    vec3.add(this.torque, this.torque, torque)
  }

  public applyImpulse(impulse: vec3) {
    vec3.scale(impulse, impulse, this.inverseMass)
    vec3.add(this.velocity, this.velocity, impulse)
  }

  public applyAngularImpulse(impulse: vec3) {
    vec3.add(this.angularVelocity, this.angularVelocity, impulse)
  }

  public move(time: Time) {
    vec3.scale(this.force, this.force, this.inverseMass)
    vec3.scale(this.force, this.force, time.deltaSeconds)
    vec3.add(this.velocity, this.velocity, this.force)
    vec3.scale(this.force, this.velocity, time.deltaSeconds)
    vec3.add(this.position, this.position, this.force)

    vec3.set(this.force, 0, 0, 0)
  }

  public rotate(time: Time) {
    // T = F * r(m) => angular impulse (ai) = F * r(m) * dt(s)
    vec3.scale(this.torque, this.torque, time.deltaSeconds) // angular impulse
    vec3.add(this.angularVelocity, this.angularVelocity, this.torque) // angular velocity
    vec3.scale(this.torque, this.angularVelocity, time.deltaSeconds) // angular impulse
    vec3.add(this.rotation, this.rotation, this.torque) // rotation

    vec3.set(this.torque, 0, 0, 0)
  }

  public update(time: Time) {
    this.move(time)
    this.rotate(time)
  }
}
