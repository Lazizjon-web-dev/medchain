<script setup lang="ts">
import PhoneIcon from './icons/PhoneIcon.vue';
import ChatIcon from './icons/ChatIcon.vue';
import EnterButton from './EnterButton.vue';
import formatDate from '../utils/formatDate.ts';

const { patient }= defineProps({
    patient: {
        id: Number,
        age: Number,
        name: String,
        created_at: String,
    },
});
</script>
<template>
  <div class="w-full h-full p-4 pr-0 box-border flex flex-col gap-4">
    <div class="flex items-center flex-5">
      <div class="bg-gray-300 h-full mr-3 aspect-square relative">
        <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRCHNxAkgp7OG0rEQSQ1_0rY037wVIotwgUjQ&s" alt="Patient Photo" />
        <div class="blur-glass rounded-4xl">
          <div class="flex-1 text-gray-100">
            <h2 class="text-xl font-semibold">{{ patient.name }}</h2>
            <p class="text-md hidden md:block">{{ patient.age }} yrs, {{ formatDate(patient.created_at) }}</p>
          </div>
          <button >
            <ChatIcon />
          </button>
          <button >
            <PhoneIcon />
          </button>
        </div>
      </div>
      <div class=" flex-1 h-full flex flex-col border border-gray-300">
        <div class="flex items-center justify-between px-2">
          <h3 class="text-xl font-semibold ml-4">Medical History</h3>
          <EnterButton/>
        </div>
        <div class="p-4 grid grid-cols-2 gap-4 flex-1">
          <div v-for="i in 4" :key="i" class="bg-gray-200 rounded-xl p-4">
            <h2 class="font-semibold">Condition {{ i }}</h2>
            <p class="mb-2">Details about condition {{ i }} go here. This</p>
          </div>
        </div>
      </div>
    </div>
    <div class="flex bg-yellow-300 flex-4">
      <div class=""></div>
      <div class=""></div>
    </div>
  </div>
</template>
<style scoped>
@import "tailwindcss";
div {
  @apply rounded-4xl;
}
img {
  @apply w-full h-full object-cover rounded-4xl;
}
.blur-glass {
  @apply p-3 flex items-center justify-between m-3 bottom-0 left-0 right-0 absolute;

  background-color: rgba(100, 100, 100, 0.4);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
button {
  @apply bg-gray-200 m-2 p-2 rounded-full md:p-4;
}
</style>
