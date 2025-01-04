import { Component } from '@/models/component'
import { mat3, vec3 } from 'gl-matrix'
import { usePhysicsStore } from '@/stores/physics'
import { Collider } from '../collisions/collider'
import type { Time } from '@/models/time'
import utils from '@/helpers/utils'

export class Rigidbody extends Component {
  public mass: number = 1
  public restitution: number = 0.5
  public staticFriction: number = 0.5
  public dynamicFriction: number = 0.3
  public velocity: vec3 = vec3.fromValues(0, 0, 0)
  public acceleration: vec3 = vec3.fromValues(0, 0, 0)
  public force: vec3 = vec3.fromValues(0, 0, 0)
  public angularVelocity: vec3 = vec3.fromValues(0, 0, 0)
  public torque: vec3 = vec3.fromValues(0, 0, 0)
  public isDynamic: boolean = true
  public isTrigger: boolean = false
  public inertiaTensor: mat3 = mat3.create()
  public inverseInertiaTensor: mat3 = mat3.create()
  public angularDamping: number = 0.5 // Damping factor for angular velocity

  constructor() {
    super()
    usePhysicsStore().addObject(this)
    this.calculateInertiaTensor()
  }

  public destroy() {
    usePhysicsStore().removeObject(this)
  }

  public get position() {
    return this.entity.transform.position
  }

  public get rotation() {
    return this.entity.transform.rotation
  }

  public get inverseMass() {
    return this.isDynamic ? 1 / this.mass : 0
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
    // p = mv
    vec3.scale(impulse, impulse, this.inverseMass)
    vec3.add(this.velocity, this.velocity, impulse)
  }

  public applyAngularImpulseOld(distance: vec3, force: vec3) {
    // L = Iω = r * p = r * mv = r * F * dt => ω = I^-1 * r * m * v = v / r
    // const impulse = vec3.cross(vec3.create(), distance, force) // angular impulse = Iω
    vec3.scale(force, force, this.inverseMass)
    const impulseVelocity = vec3.divide(vec3.create(), force, distance) // angular velocity = ω
    vec3.add(this.angularVelocity, this.angularVelocity, impulseVelocity)
  }

  public applyAngularImpulse(impulse: vec3) {
    const angularImpulse = vec3.transformMat3(vec3.create(), impulse, this.inverseInertiaTensor)
    vec3.add(this.angularVelocity, this.angularVelocity, angularImpulse)
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
    // T = F * r => angular impulse (ai) = F * r * dt(s)
    vec3.scale(this.torque, this.torque, time.deltaSeconds) //angular velocity
    vec3.transformMat3(this.torque, this.torque, this.inverseInertiaTensor)
    vec3.add(this.angularVelocity, this.angularVelocity, this.torque) // total angular velocity
    vec3.scale(this.torque, this.angularVelocity, time.deltaSeconds) // angular impulse
    vec3.add(this.rotation, this.rotation, utils.radToDegVec3(this.torque)) // rotation

    // Apply angular damping
    const dampingFactor = Math.pow(this.angularDamping, time.deltaSeconds)
    vec3.scale(this.angularVelocity, this.angularVelocity, dampingFactor)

    vec3.set(this.torque, 0, 0, 0)
  }

  public update(time: Time) {
    this.move(time)
    this.rotate(time)
  }

  private calculateInertiaTensor() {
    mat3.identity(this.inertiaTensor)
    this.colliders.forEach((collider) => {
      const colliderInertiaTensor = collider.calculateInertiaTensor(this.mass)
      mat3.add(this.inertiaTensor, this.inertiaTensor, colliderInertiaTensor)
    })
    mat3.invert(this.inverseInertiaTensor, this.inertiaTensor)
  }
}
