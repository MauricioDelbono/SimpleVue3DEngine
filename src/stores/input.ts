import { useWebGLStore } from '@/stores/webgl'
import { defineStore } from 'pinia'
import { ref, onUnmounted } from 'vue'

export const useInputStore = defineStore('input', () => {
  const keysState: Map<string, boolean> = new Map()
  const mousePosition = ref({ x: 0, y: 0 })
  const mouseDelta = ref({ x: 0, y: 0 })

  let element: HTMLElement | null = null
  let hasFocus = false
  let isLocked = false

  function updateMousePosition(event: MouseEvent) {
    if (!isLocked) return
    mouseDelta.value.x = event.movementX
    mouseDelta.value.y = event.movementY
    mousePosition.value.x += event.movementX
    mousePosition.value.y += event.movementY
  }

  function isKeyPressed(key: string) {
    return keysState.get(key) || false
  }

  function onFocus() {
    hasFocus = true
  }

  function onBlur() {
    hasFocus = false
  }

  function onKeyDown(event: KeyboardEvent) {
    keysState.set(event.code, true)
  }

  function onKeyUp(event: KeyboardEvent) {
    keysState.set(event.code, false)
  }

  function lockPointer() {
    isLocked = true
    element?.requestPointerLock()
  }

  function onPointerLockChange() {
    if (document.pointerLockElement) {
      isLocked = true
      document.addEventListener('mousemove', updateMousePosition, false)
    } else {
      isLocked = false
      document.removeEventListener('mousemove', updateMousePosition, false)
    }
  }

  function initialize() {
    const { canvas } = useWebGLStore()
    element = canvas
    element.addEventListener('focus', onFocus)
    element.addEventListener('blur', onBlur)
    element.addEventListener('keydown', onKeyDown)
    element.addEventListener('keyup', onKeyUp)
    element.addEventListener('click', lockPointer)
    document.addEventListener('pointerlockchange', onPointerLockChange)
  }

  onUnmounted(() => {
    element?.removeEventListener('focus', onFocus)
    element?.removeEventListener('blur', onBlur)
    element?.removeEventListener('keydown', onKeyDown)
    element?.addEventListener('keyup', onKeyUp)
    element?.addEventListener('click', lockPointer)
    document?.addEventListener('pointerlockchange', onPointerLockChange)
  })

  return { mousePosition, mouseDelta, initialize, isKeyPressed }
})
