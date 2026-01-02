interface QueueEntry<T> {
  value: T
  prev: QueueEntry<T>
  next: QueueEntry<T>
}

export class PriorityQueue<T extends object> implements Iterable<T> {
  get length() {
    return this._length
  }

  private lookup = new WeakMap<T, QueueEntry<T>>()
  private begin: QueueEntry<T> = null
  private end: QueueEntry<T> = null
  private _length = 0

  constructor(private readonly predicate: (a: T, b: T) => number) {}

  enqueue(value: T) {
    let entry: QueueEntry<T>

    if (this.end === null) {
      this.begin =
        this.end =
        entry =
          {
            value,
            prev: null,
            next: null
          }
    } else {
      let p = this.end
      while (p && this.predicate(p.value, value) > 0) {
        p = p.prev
      }

      if (!p) {
        // beginning
        entry = { value, prev: null, next: this.begin }
        this.begin.prev = entry
        this.begin = entry
      } else if (!p.next) {
        // end
        entry = { value, prev: p, next: null }
        this.end.next = entry
        this.end = entry
      } else {
        // in between
        entry = { value, prev: p, next: p.next }
        p.next.prev = entry
        p.next = entry
      }
    }
    this.lookup.set(value, entry)
    this._length++
  }

  dequeue(): T {
    if (this._length === 0) {
      return null
    }

    const value = this.begin.value
    if (this.begin.next) {
      this.begin.next.prev = null
    }
    this.begin = this.begin.next
    this._length--
    this.lookup.delete(value)

    return value
  }

  remove(value: T) {
    if (!this.lookup.has(value)) {
      return
    }

    const entry = this.lookup.get(value)
    if (entry.prev && entry.next) {
      entry.prev.next = entry.next
      entry.next.prev = entry.prev
    } else if (entry.next) {
      entry.next.prev = null
      this.begin = entry.next
    } else if (entry.prev) {
      entry.prev.next = null
      this.end = entry.prev
    } else {
      this.end = this.begin = null
    }

    this.lookup.delete(value)

    this._length--
  }

  *[Symbol.iterator]() {
    for (let p = this.begin; p != null; p = p.next) {
      yield p.value
    }
  }
}
