import { Component } from '@/models/component'

export class lightMovement extends Component {
  constructor() {
    super()
  }

  public update(time: number, renderDelta: number) {
    const speed = 0.0001 * time
    this.entity.transform.position[0] = 20 * Math.sin(speed)
    this.entity.transform.position[2] = 20 * Math.cos(speed)
    this.entity.transform.rotation[1] += 0.01 * renderDelta
  }
}
