import * as anchor from "@coral-xyz/anchor";
import { Wallet } from "@coral-xyz/anchor";
import { Keypair, PublicKey, Connection } from "@solana/web3.js";

export class TestWalletManager {
  private wallets: Wallet[] = [];
  private usedIndices: Set<number> = new Set();
  private currentIndex: number = 0;
  private connection: Connection;
  private initialWalletCount: number;
  private initialBalance: number;
  constructor(
    connection: Connection,
    initialWalletCount: number = 10,
    initialBalance: number = 1 * anchor.web3.LAMPORTS_PER_SOL
  ) {
    this.connection = connection;
    this.initialWalletCount = initialWalletCount;
    this.initialBalance = initialBalance;
  }

  async initialize(): Promise<void> {
    for (let i = 0; i < this.initialWalletCount; i++) {
      const keypair = Keypair.generate();
      const wallet = new Wallet(keypair);

      await this.fundWallet(wallet.publicKey);

      this.wallets.push(wallet);
    }
  }
  private async fundWallet(publicKey: PublicKey): Promise<void> {
    const signature = await this.connection.requestAirdrop(
      publicKey,
      this.initialBalance
    );

    const latestBlockhash = await this.connection.getLatestBlockhash();
    await this.connection.confirmTransaction({
      signature,
      ...latestBlockhash,
    });

    const balance = await this.connection.getBalance(publicKey);
    if (balance < this.initialBalance) {
      throw new Error(
        `Airdrop failed: Expected at least ${this.initialBalance} lamports, but got ${balance}`
      );
    }
  }

  getNextWallet(): { wallet: Wallet; index: number } {
    if (this.wallets.length === 0) {
      throw new Error(
        "WalletManager not initialized. Call initialize() first."
      );
    }

    for (let i = 0; i < this.wallets.length; i++) {
      const index = (this.currentIndex + i) % this.wallets.length;

      if (!this.usedIndices.has(index)) {
        this.usedIndices.add(index);
        this.currentIndex = (index + 1) % this.wallets.length;
        return { wallet: this.wallets[index], index };
      }
    }

    const newKeypair = Keypair.generate();
    const newWallet = new Wallet(newKeypair);
    this.wallets.push(newWallet);
    const newIndex = this.wallets.length - 1;
    this.usedIndices.add(newIndex);

    return {
      wallet: newWallet,
      index: newIndex,
    };
  }

  getWallet(index: number): Wallet {
    if (index < 0 || index >= this.wallets.length) {
      throw new Error("Index out of bounds");
    }
    return this.wallets[index];
  }

  getProgramWithWallet<T extends anchor.Idl>(
    programIdl: T,
    programId: PublicKey,
    wallet: Wallet
  ): anchor.Program<T> {
    const provider = new anchor.AnchorProvider(this.connection, wallet, {
      commitment: "confirmed",
    });
    return new anchor.Program<T>(programIdl, provider);
  }

  releaseWallet(index: number): void {
    this.usedIndices.delete(index);
  }

  *walletIterator(): Generator<
    { wallet: Wallet; index: number },
    void,
    unknown
  > {
    while (true) {
      yield this.getNextWallet();
    }
  }

  getAllWallets(): Wallet[] {
    return [...this.wallets];
  }

  getWalletCount(): number {
    return this.wallets.length;
  }

  getUsedWalletCount(): number {
    return this.usedIndices.size;
  }
}
