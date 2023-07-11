<script setup lang="ts">
import DefaultScene from './scenes/default/DefaultScene.vue'
import PhysicsScene from './scenes/physics/PhysicsScene.vue'
</script>

<template>
  <DefaultScene />
  <!-- <PhysicsScene /> -->
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
