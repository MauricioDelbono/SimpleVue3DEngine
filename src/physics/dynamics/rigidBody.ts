import { Component, EditorProp, EditorPropType } from '@/models/component'
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
  public inertiaTensorMatrix: mat3 = mat3.create()
  public inverseInertiaTensorMatrix: mat3 = mat3.create()
  public angularDamping: number = 0.05 // Damping factor for angular velocity
  public linearDamping: number = 0.05 // Damping factor for linear velocity

  constructor(mass: number = 1) {
    super()
    this.mass = mass
    usePhysicsStore().addObject(this)
    this.calculateInertiaTensorMatrix()

    // Add editor props
    this.addEditorProp(new EditorProp('isDynamic', EditorPropType.boolean))
    this.addEditorProp(new EditorProp('isTrigger', EditorPropType.boolean))
    this.addEditorProp(new EditorProp('mass', EditorPropType.number))
    this.addEditorProp(new EditorProp('restitution', EditorPropType.number))
    this.addEditorProp(new EditorProp('staticFriction', EditorPropType.number))
    this.addEditorProp(new EditorProp('dynamicFriction', EditorPropType.number))
    this.addEditorProp(new EditorProp('linearDamping', EditorPropType.number))
    this.addEditorProp(new EditorProp('angularDamping', EditorPropType.number))
    this.addEditorProp(new EditorProp('velocity', EditorPropType.vec3, true))
    this.addEditorProp(new EditorProp('angularVelocity', EditorPropType.vec3, true))
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

  public get inertiaTensor() {
    if (!this.isDynamic) return Infinity
    const collider = this.entity.getComponents(Collider)[0]
    return collider?.getInertiaTensor(this.mass) ?? Infinity
  }

  public get inverseInertiaTensor() {
    if (!this.isDynamic) return 0
    return 1 / this.inertiaTensor
  }

  public get isStatic() {
    return !this.isDynamic
  }

  public get isRotating() {
    return !this.angularVelocity.every((v) => v === 0)
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

  public applyAngularImpulse(impulse: vec3) {
    const angularImpulse = vec3.scale(vec3.create(), impulse, this.inverseInertiaTensor)
    vec3.add(this.angularVelocity, this.angularVelocity, angularImpulse)
  }

  public move(time: Time) {
    vec3.scale(this.force, this.force, time.deltaSeconds)
    vec3.scale(this.force, this.force, this.inverseMass)
    vec3.add(this.velocity, this.velocity, this.force)
    vec3.scale(this.force, this.velocity, time.deltaSeconds)
    vec3.add(this.position, this.position, this.force)

    // Apply linear damping
    // const dampingFactor = Math.pow(this.linearDamping, time.deltaSeconds)
    // vec3.scale(this.velocity, this.velocity, dampingFactor)

    vec3.set(this.force, 0, 0, 0)
  }

  public rotate(time: Time) {
    vec3.scale(this.torque, this.torque, time.deltaSeconds) //angular velocity
    vec3.scale(this.torque, this.torque, this.inverseInertiaTensor)
    vec3.add(this.angularVelocity, this.angularVelocity, this.torque) // total angular velocity
    vec3.scale(this.torque, this.angularVelocity, time.deltaSeconds) // rotation radians
    vec3.add(this.rotation, this.rotation, utils.radToDegVec3(this.torque)) // rotation

    // Apply angular damping
    // const dampingFactor = Math.pow(this.angularDamping, time.deltaSeconds)
    // vec3.scale(this.angularVelocity, this.angularVelocity, dampingFactor)

    vec3.set(this.torque, 0, 0, 0)
  }

  public update(time: Time) {
    this.move(time)
    this.rotate(time)
  }

  private calculateInertiaTensorMatrix() {
    mat3.identity(this.inertiaTensorMatrix)
    this.colliders.forEach((collider) => {
      const colliderInertiaTensor = collider.calculateInertiaTensor(this.mass)
      mat3.add(this.inertiaTensorMatrix, this.inertiaTensorMatrix, colliderInertiaTensor)
    })
    mat3.invert(this.inverseInertiaTensorMatrix, this.inertiaTensorMatrix)
  }
}
