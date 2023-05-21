import type { Entity } from './entity'

export class Component {
  public entity: Entity

  constructor(entity: Entity) {
    this.entity = entity
    this.start()
  }

  public awake() {}
  public start() {}
  public update(time: number, renderDelta: number) {}
  public lateUpdate(time: number, renderDelta: number) {}
  public destroy() {}
}
