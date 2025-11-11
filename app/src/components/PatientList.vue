<script setup lang="ts">
  import PatientListItem from './PatientListItem.vue';
  const { patients } = defineProps({
    patients: {
      type: Array,
      required: true,
    },
  })
</script>
<template>
  <div class="">
    <div v-for="patient in patients" :key="patient.id">
      <PatientListItem :patient="patient" />
    </div>
  </div>
</template>

