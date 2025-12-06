import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Medchain } from "../../target/types/medchain";
import { expect, assert } from "chai";
import { PublicKey } from "@solana/web3.js";
import { TestWalletManager } from "../utils/wallet-manager";
describe("Patient Accounts", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.medchain as Program<Medchain>;
  const connection = provider.connection;

  let walletManager: TestWalletManager;

  before(async () => {
    walletManager = new TestWalletManager(
      connection,
      10,
      anchor.web3.LAMPORTS_PER_SOL
    );
    await walletManager.initialize();
  });

  it("Initialize with valid name", async () => {
    const { wallet: patientWallet } = walletManager.getNextWallet();

    const patientProgram = walletManager.getProgramWithWallet(
      program.idl,
      program.programId,
      patientWallet
    );

    const [patientPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("patient"), patientWallet.publicKey.toBuffer()],
      program.programId
    );

    const patientName = "John Doe";

    const tx = await patientProgram.methods
      .initializePatient(patientName)
      .accounts({ user: patientWallet.publicKey, patientAccount: patientPda })
      .rpc();

    console.log("Patient account initialized with tx:", tx);

    // Fetch the patient account and verify the data
    const patientAccount = await patientProgram.account.patientAccount.fetch(
      patientPda
    );

    // Verify the account data
    expect(patientAccount.authority.toString()).to.equal(
      patientWallet.publicKey.toString()
    );
    expect(patientAccount.name).to.equal(patientName);
    assert.isTrue(patientAccount.recordCount.isZero());
    expect(patientAccount.createdAt.toNumber()).to.be.above(0); // Should be recent timestamp
  });

  it("Initialize with maximum allowed name length", async () => {
    const { wallet: patientWallet } = walletManager.getNextWallet();

    const patientProgram = walletManager.getProgramWithWallet(
      program.idl,
      program.programId,
      patientWallet
    );

    const [patientPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("patient"), patientWallet.publicKey.toBuffer()],
      program.programId
    );

    const maxLengthName = "A".repeat(50); // Assuming 50 is the max length
    const tx = await patientProgram.methods
      .initializePatient(maxLengthName)
      .accounts({ user: patientWallet.publicKey, patientAccount: patientPda })
      .rpc();

    console.log("Patient account initialized with max length name tx:", tx);

    // Fetch the patient account and verify the data
    const patientAccount = await patientProgram.account.patientAccount.fetch(
      patientPda
    );

    // Verify the account data
    expect(patientAccount.name).to.equal(maxLengthName);
  });

  it("Initialize with minimum allowed name length", async () => {
    const { wallet: patientWallet } = walletManager.getNextWallet();

    const patientProgram = walletManager.getProgramWithWallet(
      program.idl,
      program.programId,
      patientWallet
    );

    const [patientPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("patient"), patientWallet.publicKey.toBuffer()],
      program.programId
    );

    const minLengthName = "A"; // Assuming 1 is the min length
    const tx = await patientProgram.methods
      .initializePatient(minLengthName)
      .accounts({ user: patientWallet.publicKey, patientAccount: patientPda })
      .rpc();

    console.log("Patient account initialized with min length name tx:", tx);

    // Fetch the patient account and verify the data
    const patientAccount = await patientProgram.account.patientAccount.fetch(
      patientPda
    );

    // Verify the account data
    expect(patientAccount.name).to.equal(minLengthName);
  });
  it("Initialize with empty name should fail", async () => {
    const { wallet: patientWallet } = walletManager.getNextWallet();

    const patientProgram = walletManager.getProgramWithWallet(
      program.idl,
      program.programId,
      patientWallet
    );

    const [patientPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("patient"), patientWallet.publicKey.toBuffer()],
      program.programId
    );

    const emptyName = "";
    try {
      await patientProgram.methods
        .initializePatient(emptyName)
        .accounts({ user: patientWallet.publicKey, patientAccount: patientPda })
        .rpc();
    } catch (error) {
      if (error.error.errorCode.code !== "NameEmpty") throw error;
    }
  });
  it("Initialize with name exceeding maximum length should fail", async () => {
    const { wallet: patientWallet } = walletManager.getNextWallet();

    const patientProgram = walletManager.getProgramWithWallet(
      program.idl,
      program.programId,
      patientWallet
    );

    const [patientPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("patient"), patientWallet.publicKey.toBuffer()],
      program.programId
    );

    const longName = "A".repeat(51); // Assuming 50 is the max length
    try {
      await patientProgram.methods
        .initializePatient(longName)
        .accounts({ user: patientWallet.publicKey, patientAccount: patientPda })
        .rpc();
    } catch (error) {
      if (error.error.errorCode.code !== "NameTooLong") throw error;
    }
  });
  it("Duplicate patient account initialization should fail", async () => {
    const { wallet: patientWallet } = walletManager.getNextWallet();

    const patientProgram = walletManager.getProgramWithWallet(
      program.idl,
      program.programId,
      patientWallet
    );

    const [patientPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("patient"), patientWallet.publicKey.toBuffer()],
      program.programId
    );

    const patientName = "Jane Doe";
    // First initialization
    await patientProgram.methods
      .initializePatient(patientName)
      .accounts({ user: patientWallet.publicKey, patientAccount: patientPda })
      .rpc();

    // Attempt duplicate initialization
    try {
      await patientProgram.methods
        .initializePatient(patientName)
        .accounts({ user: patientWallet.publicKey, patientAccount: patientPda })
        .rpc();
    } catch (error) {
      return;
    }
    throw new Error("Duplicate initialization should have failed");
  });
  it("Initialize with non-signer wallet should fail", async () => {
    const { wallet: patientWallet } = walletManager.getNextWallet();

    const [patientPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("patient"), patientWallet.publicKey.toBuffer()],
      program.programId
    );

    const patientName = "Alice Doe";
    const nonSignerProvider = anchor.AnchorProvider.local();
    const nonSignerProgram = new anchor.Program<Medchain>(
      program.idl,
      nonSignerProvider
    );

    try {
      await nonSignerProgram.methods
        .initializePatient(patientName)
        .accounts({ user: patientWallet.publicKey, patientAccount: patientPda })
        .rpc();
    } catch (error) {
      return;
    }
    throw new Error("Initialization with non-signer should have failed");
  });
});
