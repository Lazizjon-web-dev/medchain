import { ref, onMounted } from "vue";

declare global {
  interface PhantomProvider {
    bitcoin?: any;
    solana?: any;
    ethereum?: any;
    sui?: any;
  }

  interface Window {
    phantom?: PhantomProvider;
    solflare?: any;
  }
}

export function useWallet() {
  const connected = ref(false);
  const publicKey = ref<string | null>(null);
  const walletProvider = ref<string | null>(null);

  const connect = async (provider: "phantom" | "solflare") => {
    try {
      let wallet: any;
      if (provider === "phantom") {
        wallet = window.phantom?.solana;
      } else if (provider === "solflare") {
        wallet = window.solflare;
      }

      if (!wallet) {
        throw new Error(`${provider} wallet not found`);
      }

      await wallet.connect();
      connected.value = true;
      console.log("Public Key", wallet.publicKey.toString());
      publicKey.value = wallet.publicKey.toString();
      walletProvider.value = provider;

      // Store wallet instance for transactions
      localStorage.setItem("walletProvider", provider);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      throw error;
    }
  };

  const disconnect = async () => {
    if (walletProvider.value === "phantom" && window.phantom?.solana) {
      await window.phantom?.solana.disconnect();
    } else if (walletProvider.value === "solflare" && window.solflare) {
      window.solflare.disconnect();
    }

    connected.value = false;
    publicKey.value = null;
    walletProvider.value = null;
    localStorage.removeItem("walletProvider");
  };

  const checkConnection = async () => {
    const provider = localStorage.getItem("walletProvider") as
      | "phantom"
      | "solflare"
      | null;
    if (!provider) return;

    const wallet = provider === "phantom" ? window.solana : window.solflare;

    if (wallet && wallet.isConnected) {
      connected.value = true;
      publicKey.value = wallet.publicKey.toString();
      walletProvider.value = provider;
    }
  };
  onMounted(() => setTimeout(checkConnection, 1000));

  return {
    connected,
    publicKey,
    walletProvider,
    connect,
    disconnect,
    checkConnection,
  };
}
