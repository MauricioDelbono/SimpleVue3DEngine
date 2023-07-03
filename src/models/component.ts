import { Entity } from './entity'

export abstract class Component {
  public entity: Entity

  constructor() {
    this.entity = new Entity()
    this.start()
  }

  public awake() {}
  public start() {}
  public update(time: number, renderDelta: number) {}
  public lateUpdate(time: number, renderDelta: number) {}
  public destroy() {}
}
