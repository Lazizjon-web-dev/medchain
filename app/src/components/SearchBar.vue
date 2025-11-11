<template>
  <div>
    <SearchIcon />

    <input type="text" class="Search" placeholder="Search..." />
  </div>
</template>
<script setup lang="ts">
import SearchIcon from "./icons/SearchIcon.vue";
</script>
<style scoped>
@import "tailwindcss";
div{
  @apply bg-gray-200 w-full h-fit flex rounded-full justify-between items-center;
}
svg {
  @apply block mx-3;
}
input {
  @apply p-3 w-full rounded-r-full;
}
input:focus {
  @apply outline-none;
}
</style>
