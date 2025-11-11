<script setup lang="ts">
import SearchBar from '../components/SearchBar.vue';
import PatientListItem from '../components/PatientListItem.vue';
import PatientProfile from '../components/PatientProfile.vue';
import FilterIcon from '../components/icons/FilterIcon.vue';
import SortIcon from '../components/icons/SortIcon.vue';
const patients = [
  { id: 1, name: 'John Doe', age: 45, created_at: '2022-01-15', next_appointment: '2023-07-20' },
  { id: 2, name: 'Jane Smith', age: 38, created_at: '2021-12-22', next_appointment: '2023-08-05' },
  { id: 3, name: 'Alice Johnson', age: 52, created_at: '2023-03-10', next_appointment: '2023-09-12' },
  { id: 4, name: 'Bob Brown', age: 60, created_at: '2020-11-05', next_appointment: '2023-10-30' },
  { id: 5, name: 'Charlie Davis', age: 29, created_at: '2023-06-18', next_appointment: '2023-11-15' },
  { id: 6, name: 'Diana Evans', age: 33, created_at: '2021-09-30', next_appointment: '2023-12-01' },
  { id: 7, name: 'Frank Green', age: 47, created_at: '2022-05-12', next_appointment: '2024-01-20' },
  { id: 8, name: 'Grace Harris', age: 41, created_at: '2020-08-25', next_appointment: '2024-02-14' },
  { id: 9, name: 'Henry Lee', age: 55, created_at: '2023-02-14', next_appointment: '2024-03-10' },
  { id: 10, name: 'Ivy Martinez', age: 36, created_at: '2021-07-19', next_appointment: '2024-04-22' },
  { id: 11, name: 'Jack Nelson', age: 50, created_at: '2022-10-03', next_appointment: '2024-05-18' },
  { id: 12, name: 'Kathy Owens', age: 28, created_at: '2023-04-27', next_appointment: '2024-06-30' },
]
</script>

<template>
  <div class="w-full h-[90vh] mt-18">
    <div class="text-2xl font-bold mb-4">Patients</div>
    <div class="m-4 p-4 border border-gray-200 rounded-4xl">
    <div class="h-fit w-full p-1 border-gray-200 border rounded-full flex justify-between items-center gap-1">
      <SearchBar />
      <button> 
        <FilterIcon /> 
        <div>Filter</div>
      </button>
      <button>
        <SortIcon /> 
        <div>Sort by</div>
      </button>
    </div>
    <div class="flex w-full h-[80vh]">
      <div class="md:w-[40%] w-full h-full overflow-scroll p-4 bg-blue-500">
        <div v-for="patient in patients" :key="patient.id">
          <PatientListItem :patient="patient" />
        </div>
      </div>
      <div class="md:w-[60%] w-full">
        <PatientProfile :patient="patients[0]" />
      </div>
    </div>
    </div>
  </div>
</template>
<style scoped>
@import "tailwindcss";
button {
  @apply bg-gray-200 p-2 rounded-full flex items-center gap-1 w-max h-12;
}
button>div {
  @apply hidden font-semibold md:block whitespace-nowrap;
}
svg {
  @apply w-6 h-6;
}
</style>

