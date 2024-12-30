export class Time {
  public timestamp: number
  public delta: number
  public deltaSeconds: number

  constructor(timestamp: number, previousTime: Time | null = null) {
    this.timestamp = timestamp
    this.delta = previousTime ? timestamp - previousTime.timestamp : 0
    this.deltaSeconds = this.delta / 1000
  }
}
