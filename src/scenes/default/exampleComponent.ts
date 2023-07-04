import { Component } from '@/models/component'

export class ExampleComponent extends Component {
  private speed: number = 0.05

  public awake() {
    console.log('Awake')
  }

  public start() {
    console.log('Start')
  }

  public update(time: number, renderDelta: number) {
    this.entity.transform.rotation[1] += this.speed * renderDelta
    // console.log('Update')
  }

  public destroy() {
    console.log('Destroy')
  }
}
