<template>
  <div class="w-full box-border flex justify-between items-center my-2 p-2 border border-gray-500 rounded-full">
    <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRCHNxAkgp7OG0rEQSQ1_0rY037wVIotwgUjQ&s"/> 
     <div>
       <div>{{ patient.name }}</div>
       <div>Heart Failure</div>
     </div>
     <div class="flex items-center gap-1 bg-yellow-300 px-3 rounded-full font-semibold"> 
       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
         <circle cx="6" cy="6" r="4" fill="#000000" stroke-width="0"></circle>
       </svg>
       Chronic form </div>
     <div> {{ patient.next_appointment.replaceAll("-", "/") }} </div>
     <EnterButton /> 
  </div>
</template>
<script setup lang="ts">
import EnterButton from './EnterButton.vue';
const { patient } = defineProps({
  patient: {
    id: Number,
    name: String,
    age: Number,
    created_at: String,
    next_appointment: String,
  },
});
</script>
<style scoped>
@import "tailwindcss";
img {
  @apply w-12 h-12 rounded-full ;
}

button {
  @apply w-fit h-fit rounded-full m-1 p-2 bg-gray-300 hover:bg-gray-400; 
}
</style>
