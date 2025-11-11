<script setup lang="ts">
import NavigationBar from './components/NavigationBar.vue'
import { RouterView } from 'vue-router'
</script>

<template>
  <div>
    <NavigationBar />
    <RouterView />
  </div>
</template>

<style scoped>
</style>
