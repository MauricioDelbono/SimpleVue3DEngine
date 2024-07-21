<script setup lang="ts">
// import LightScene from './scenes/light/LightScene.vue'
import ShadowScene from './scenes/shadow/ShadowScene.vue'
// import PhysicsScene from './scenes/physics/PhysicsScene.vue'
</script>

<template>
  <ShadowScene />
</template>

<style scoped lang="scss"></style>

<style lang="scss">
body,
html {
  width: 100%;
  height: 100%;
  margin: 0;
}

#app {
  width: 100%;
  height: 100%;
  display: flex;
}
</style>
