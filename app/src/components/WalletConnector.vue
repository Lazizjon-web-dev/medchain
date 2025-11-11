<template>
<div class="wallet-connector">
  <div v-if="!connected" class="flex gap-2">
    <!-- <button 
      @click="connectWallet('phantom')"
      class="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
    >
      Connect Phantom
    </button> -->
    <button 
      @click="connectWallet('solflare')"
      class="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition-colors"
    >
      Connect Solflare
    </button>
  </div>
  
  <div v-else class="flex items-center gap-4">
    <div class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
      Connected
    </div>
    <span class="text-sm font-mono">{{ shortenedAddress }}</span>
    <button 
      @click="disconnectWallet"
      class="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 transition-colors"
    >
      Disconnect
    </button>
  </div>
</div>
</template>
<script setup lang="ts">
import { useWallet } from '../composables/useWallet';
import { computed } from 'vue';
  
const { connected, publicKey, connect, disconnect } = useWallet();
  
const shortenedAddress = computed(() => {
  if (!publicKey.value) return '';
  return `${publicKey.value.slice(0, 4)}...${publicKey.value.slice(-4)}`;
});

const connectWallet = async (provider: 'phantom' | 'solflare') => {
  try {
    await connect(provider);
  } catch (error:any) {
    alert(`Connection failed: ${error.message}`);
  }
}

const disconnectWallet = () => {
  disconnect();
}
</script>
