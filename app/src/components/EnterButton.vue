<script setup lang="ts">
import GreaterThanIcon from './icons/GreaterThanIcon.vue';
</script>
<template>
  <button>
    <GreaterThanIcon />
  </button>
</template>
<style scoped>
@import "tailwindcss";
button {
  @apply w-fit h-fit rounded-full m-1 p-2 bg-gray-300 hover:bg-gray-400; 
}
</style>
