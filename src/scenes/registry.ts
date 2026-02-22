import { defineAsyncComponent } from 'vue'

export interface SceneDefinition {
  name: string
  id: string
  component: any
}

export const scenes: SceneDefinition[] = [
  {
    name: 'Physics Simple',
    id: 'physics-simple',
    component: defineAsyncComponent(() => import('./physics/PhysicsSimpleScene.vue'))
  },
  {
    name: 'Physics',
    id: 'physics',
    component: defineAsyncComponent(() => import('./physics/PhysicsScene.vue'))
  },
  {
    name: 'Light',
    id: 'light',
    component: defineAsyncComponent(() => import('./light/LightScene.vue'))
  },
  {
    name: 'Shadows',
    id: 'shadows',
    component: defineAsyncComponent(() => import('./shadow/ShadowScene.vue'))
  }
]

export function getSceneById(id: string): SceneDefinition | undefined {
  return scenes.find((scene) => scene.id === id)
}
