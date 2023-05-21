import KeyCodes from '@/constants/keyCodes'
import utils from '@/helpers/utils'
import { useInputStore } from '@/stores/input'
import { useRenderStore } from '@/stores/render'
import { vec3 } from 'gl-matrix'
import { storeToRefs } from 'pinia'
import { onMounted } from 'vue'

const MAX_DEGREES = 360
const PIXELS_PER_ROUND = 1000
const MOUSE_SENSITIVITY = 2

export function useCamera() {
  const store = useRenderStore()
  const { scene } = storeToRefs(store)
  const input = useInputStore()
  const { mouseDelta } = storeToRefs(input)
  const translation = vec3.create()
  const rotationOrigin = vec3.create()
  const speed = 0.01
  const lookSpeed = PIXELS_PER_ROUND * MOUSE_SENSITIVITY

  const update = (time: number, renderDelta: number) => {
    const angleX = (mouseDelta.value.x * MAX_DEGREES) / lookSpeed
    const angleY = (mouseDelta.value.y * MAX_DEGREES) / lookSpeed
    mouseDelta.value.x = 0
    mouseDelta.value.y = 0
    scene.value.camera.rotation[0] -= angleY
    scene.value.camera.rotation[1] -= angleX
    vec3.zero(translation)

    if (input.isKeyPressed(KeyCodes.KEY_W)) {
      translation[2] -= speed * renderDelta
    }

    if (input.isKeyPressed(KeyCodes.KEY_S)) {
      translation[2] += speed * renderDelta
    }

    if (input.isKeyPressed(KeyCodes.KEY_A)) {
      translation[0] -= speed * renderDelta
    }

    if (input.isKeyPressed(KeyCodes.KEY_D)) {
      translation[0] += speed * renderDelta
    }

    if (input.isKeyPressed(KeyCodes.KEY_Q)) {
      translation[1] -= speed * renderDelta
    }

    if (input.isKeyPressed(KeyCodes.KEY_E)) {
      translation[1] += speed * renderDelta
    }

    vec3.rotateX(translation, translation, rotationOrigin, utils.degToRad(scene.value.camera.rotation[0]))
    vec3.rotateY(translation, translation, rotationOrigin, utils.degToRad(scene.value.camera.rotation[1]))
    vec3.add(scene.value.camera.position, scene.value.camera.position, translation)
  }

  onMounted(() => {
    store.subscribeToRender({ update, lateUpdate: () => {} })
  })

  return {}
}
