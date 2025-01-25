import { Entity } from './entity'
import type { Time } from './time'

export const EditorPropType = {
  boolean: 'boolean',
  number: 'number',
  string: 'string',
  vec3: 'vec3'
}

export class EditorProp {
  public label: string
  public name: string
  public type: string
  public isReadonly: boolean = false

  constructor(name: string, type: string, isReadonly: boolean = false, label: string | null = null) {
    this.name = name
    this.type = type
    this.isReadonly = isReadonly
    this.label = label ?? name.split(/(?=[A-Z])/).join(' ')
    this.label = this.label.charAt(0).toUpperCase() + this.label.slice(1)
  }
}

export abstract class Component {
  public entity: Entity
  public isDisplayed: boolean = true
  public isAwake: boolean = false
  public isUnique: boolean = false
  public editorProps: EditorProp[] = []

  constructor() {
    this.entity = new Entity(undefined, undefined)
    this.start()
  }

  public awake() {
    this.isAwake = true
  }

  public sleep() {
    this.isAwake = false
  }

  public addEditorProp(prop: EditorProp) {
    this.editorProps.push(prop)
  }

  public start() {}
  public update(time: Time) {}
  public lateUpdate(time: Time) {}
  public destroy() {}
}
