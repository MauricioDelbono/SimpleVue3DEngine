import { Component, EditorProp, EditorPropType } from '@/models/component'
import { mat3, vec3 } from 'gl-matrix'
import { usePhysicsStore } from '@/stores/physics'
import { Collider } from '../collisions/collider'
import type { Time } from '@/models/time'
import utils from '@/helpers/utils'

export class Rigidbody extends Component {
  public mass: number = 1
  public restitution: number = 0.1 // Reduced from 0.5 to minimize bouncing
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
  public angularDamping: number = 0.95 // Increased from 0.05 to help settle angular motion
  public linearDamping: number = 0.98 // Increased from 0.99 to help settle linear motion
  public isSleeping: boolean = false
  public sleepTimer: number = 0
  public readonly sleepThreshold = 0.05 // Velocity threshold for sleep
  public readonly sleepTime = 1.0 // Time in seconds before object sleeps

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
    if (vec3.length(force) > 0.01) {
      this.wakeUp() // Wake up when significant force applied
    }
    vec3.add(this.force, this.force, force)
  }

  public applyTorque(torque: vec3) {
    if (vec3.length(torque) > 0.01) {
      this.wakeUp() // Wake up when significant torque applied
    }
    vec3.add(this.torque, this.torque, torque)
  }

  public applyImpulse(impulse: vec3) {
    if (vec3.length(impulse) > 0.01) {
      this.wakeUp()
    }
    const scaledImpulse = vec3.scale(vec3.create(), impulse, this.inverseMass)
    vec3.add(this.velocity, this.velocity, scaledImpulse)
  }

  public applyAngularImpulse(impulse: vec3) {
    if (vec3.length(impulse) > 0.01) {
      this.wakeUp() // Wake up when significant angular impulse applied
    }
    const angularImpulse = vec3.scale(vec3.create(), impulse, this.inverseInertiaTensor)
    vec3.add(this.angularVelocity, this.angularVelocity, angularImpulse)
  }

  public move(time: Time) {
    if (this.isSleeping) return // Skip physics for sleeping objects

    // Apply acceleration from forces: F = ma -> a = F/m
    const acceleration = vec3.scale(vec3.create(), this.force, this.inverseMass)

    // Update velocity: v = v + a*dt
    vec3.scaleAndAdd(this.velocity, this.velocity, acceleration, time.deltaSeconds)

    // Apply linear damping
    const dampingFactor = Math.pow(this.linearDamping, time.deltaSeconds)
    const oldVelocity = vec3.clone(this.velocity)
    vec3.scale(this.velocity, this.velocity, dampingFactor)

    // Check for sleep conditions
    this.updateSleepState(time)

    // Snap small velocities to zero to help objects come to rest
    const velocityThreshold = 0.01
    if (vec3.length(this.velocity) < velocityThreshold) {
      vec3.set(this.velocity, 0, 0, 0)
    }

    // Update position: p = p + v*dt
    const oldPosition = vec3.clone(this.position)
    vec3.scaleAndAdd(this.position, this.position, this.velocity, time.deltaSeconds)

    // Clear forces for next frame
    vec3.set(this.force, 0, 0, 0)
  }

  public rotate(time: Time) {
    if (this.isSleeping) return // Skip physics for sleeping objects

    // Apply angular acceleration from torque: τ = Iα -> α = τ/I
    const angularAcceleration = vec3.scale(vec3.create(), this.torque, this.inverseInertiaTensor)

    // Update angular velocity: ω = ω + α*dt
    vec3.scaleAndAdd(this.angularVelocity, this.angularVelocity, angularAcceleration, time.deltaSeconds)

    // Apply angular damping
    const dampingFactor = Math.pow(this.angularDamping, time.deltaSeconds)
    vec3.scale(this.angularVelocity, this.angularVelocity, dampingFactor)

    // Snap small angular velocities to zero to help objects come to rest
    const angularVelocityThreshold = 0.01
    if (vec3.length(this.angularVelocity) < angularVelocityThreshold) {
      vec3.set(this.angularVelocity, 0, 0, 0)
    }

    // Update rotation: θ = θ + ω*dt (keep in radians for now)
    const rotationDelta = vec3.scale(vec3.create(), this.angularVelocity, time.deltaSeconds)
    vec3.add(this.rotation, this.rotation, utils.radToDegVec3(rotationDelta))

    // Clear torque for next frame
    vec3.set(this.torque, 0, 0, 0)
  }

  public step(time: Time) {
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

  private updateSleepState(time: Time) {
    const linearSpeed = vec3.length(this.velocity)
    const angularSpeed = vec3.length(this.angularVelocity)

    if (linearSpeed < this.sleepThreshold && angularSpeed < this.sleepThreshold) {
      this.sleepTimer += time.deltaSeconds
      if (this.sleepTimer >= this.sleepTime) {
        this.goToSleep()
      }
    } else {
      this.wakeUp()
    }
  }

  public goToSleep() {
    this.isSleeping = true
    vec3.set(this.velocity, 0, 0, 0)
    vec3.set(this.angularVelocity, 0, 0, 0)
    vec3.set(this.force, 0, 0, 0)
    vec3.set(this.torque, 0, 0, 0)
  }

  public wakeUp() {
    this.isSleeping = false
    this.sleepTimer = 0
  }
}
