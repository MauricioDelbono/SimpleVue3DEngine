import { Entity } from './entity'
import type { Time } from './time'

export abstract class Component {
  public entity: Entity

  constructor() {
    this.entity = new Entity()
    this.start()
  }

  public awake() {}
  public start() {}
  public update(time: Time) {}
  public lateUpdate(time: Time) {}
  public destroy() {}
}
