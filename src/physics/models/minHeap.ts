import { Face } from './face'

export class MinHeap {
  public heap: Array<{ face: Face; distance: number }>

  constructor() {
    this.heap = []
  }

  insert(face: Face, distance: number) {
    this.heap.push({ face, distance })
    this.bubbleUp(this.heap.length - 1)
  }

  extractMin() {
    if (this.heap.length === 0) return { face: new Face([], []), distance: 0 }
    if (this.heap.length === 1) return this.heap.pop() ?? { face: new Face([], []), distance: 0 }

    const min = this.heap[0]
    this.heap[0] = this.heap.pop() ?? min
    this.bubbleDown(0)
    return min
  }

  bubbleUp(index: number) {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2)
      if (this.heap[parent].distance <= this.heap[index].distance) break
      ;[this.heap[parent], this.heap[index]] = [this.heap[index], this.heap[parent]]
      index = parent
    }
  }

  bubbleDown(index: number) {
    const length = this.heap.length
    while (true) {
      let smallest = index
      const left = 2 * index + 1
      const right = 2 * index + 2

      if (left < length && this.heap[left].distance < this.heap[smallest].distance) {
        smallest = left
      }
      if (right < length && this.heap[right].distance < this.heap[smallest].distance) {
        smallest = right
      }
      if (smallest === index) break
      ;[this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]]
      index = smallest
    }
  }

  updateDistance(face: Face, newDistance: number) {
    const index = this.heap.findIndex((item) => item.face === face)
    if (index !== -1) {
      this.heap[index].distance = newDistance
      this.bubbleUp(index)
      this.bubbleDown(index)
    }
  }

  isEmpty() {
    return this.heap.length === 0
  }
}
