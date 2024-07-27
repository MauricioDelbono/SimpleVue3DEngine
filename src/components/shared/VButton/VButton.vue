<script setup lang="ts"></script>

<template>
  <button class="v-button" v-bind="$attrs"><slot /></button>
</template>

<style scoped lang="scss">
.v-button {
  background: #2d2d2d;
  border: 1px solid gray;
  border-radius: 4px;
  padding: 4px 10px;
  color: white;

  &:disabled {
    opacity: 0.5;
  }

  &:hover {
    cursor: pointer;
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
}
</style>
