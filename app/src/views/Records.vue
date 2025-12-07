<script setup lang="ts">
  const records = [
    { id: 1, type: 'X-Ray', description: 'Chest X-Ray', created_at: '2022-03-05', ipfs_hash: 'QmX....', doctors: ['Doctor1hash...', 'Doctor2hash...'], },
    { id: 2, type: 'Lab Report', description: 'Blood Test', created_at: '2022-06-15', ipfs_hash: 'QmY....', doctors: ['Doctor3hash...'], },
    { id: 3, type: 'MRI Scan', description: 'Brain MRI', created_at: '2023-01-20', ipfs_hash: 'QmZ....', doctors: ['Doctor1hash...', 'Doctor4hash...'], },
    { id: 4, type: 'Prescription', description: 'Diabetes Medication', created_at: '2023-04-10', ipfs_hash: 'QmA....', doctors: ['Doctor2hash...'], },
    { id: 5, type: 'Ultrasound', description: 'Abdominal Ultrasound', created_at: '2023-05-25', ipfs_hash: 'QmB....', doctors: ['Doctor5hash...'], },
  ]
</script>
<template>
   <div class="w-full h-[90vh] mt-18">
    <div class="text-2xl font-bold mb-4">Medical Records</div>
    <div class="m-4 border border-gray-200 rounded-4xl">
      <div class="flex w-full h-[80vh]">
        <div class="w-full h-full overflow-scroll p-4">
          <!-- Desktop Table View -->
          <div class="hidden lg:block">
            <table class="">
            </table>
          </div>
          <!-- Mobile/Tablet Card View -->
          <div class="lg:hidden">
          </div>
        </div>
      </div>
    </div>
   </div>
</template>

