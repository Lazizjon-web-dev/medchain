import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Medchain } from "../../target/types/medchain";
import { PublicKey } from "@solana/web3.js";
import { expect, assert } from "chai";
import { TestWalletManager } from "../utils/wallet-manager";

describe("Medical Records", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.medchain as Program<Medchain>;
  const connection = provider.connection;

  let patientProgram: Program<Medchain>;
  let walletManager: TestWalletManager;
  let patientWallet: anchor.Wallet;
  let patientPda: PublicKey;

  before(async () => {
    walletManager = new TestWalletManager(
      connection,
      1,
      anchor.web3.LAMPORTS_PER_SOL
    );
    await walletManager.initialize();
    patientWallet = walletManager.getNextWallet().wallet;

    patientProgram = walletManager.getProgramWithWallet(
      program.idl,
      program.programId,
      patientWallet
    );

    [patientPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("patient"), patientWallet.publicKey.toBuffer()],
      program.programId
    );

    const patientName = "John Doe";

    const tx = await patientProgram.methods
      .initializePatient(patientName)
      .accounts({ user: patientWallet.publicKey, patientAccount: patientPda })
      .rpc();

    console.log("Patient account initialized with tx:", tx);
  });

  it("Add record with valid data", async () => {
    // Get current record count to use as record_id
    const patientAccount = await patientProgram.account.patientAccount.fetch(
      patientPda
    );
    const recordId = patientAccount.recordCount;

    // Derive medical record PDA
    const [medicalRecordPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("record"),
        patientWallet.publicKey.toBuffer(),
        new anchor.BN(recordId).toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    // Test data
    const testData = {
      ipfsHash: "6z3jFxaOo8mn9XrWiiEiCYUUa8CXLz4y5PABE4p1dGPfGH",
      recordType: "lab_report",
      description: "Blood test results",
      encryptedKey:
        "2GcR3XW7NBhzxsPUWfRtbzQYJCrYeaHrwrLd2izulYGn4OEZ6POpM17daD57KtN8qItKlOvVCi4zBKMYY0AzLJ30Z3mKJXRX3c5ON9A1UjBBCZEKuGCe3kvnlLHeuiFj",
    };

    // Add medical record
    const tx = await patientProgram.methods
      .addMedicalRecord(
        recordId,
        testData.recordType,
        testData.description,
        testData.ipfsHash,
        testData.encryptedKey
      )
      .accounts({
        authority: patientWallet.publicKey,
        patientAccount: patientPda,
        medicalRecord: medicalRecordPda,
      })
      .rpc();
    console.log("Medical record added:", tx);

    // Verify the medical record was created correctly
    const medicalRecordAccount =
      await patientProgram.account.medicalRecord.fetch(medicalRecordPda);

    assert.equal(
      medicalRecordAccount.authority.toString(),
      patientPda.toString()
    );
    expect(medicalRecordAccount.recordId.toNumber()).to.equal(
      recordId.toNumber()
    );
    assert.equal(medicalRecordAccount.ipfsHash, testData.ipfsHash);
    assert.equal(medicalRecordAccount.recordType, testData.recordType);
    assert.equal(medicalRecordAccount.description, testData.description);
    assert.equal(medicalRecordAccount.encryptedKey, testData.encryptedKey);
    assert.isTrue(medicalRecordAccount.createdAt.gt(new anchor.BN(0)));

    // Verify patient's record count was incremented
    const updatedPatientAccount =
      await patientProgram.account.patientAccount.fetch(patientPda);
    expect(updatedPatientAccount.recordCount.toNumber()).to.equal(
      recordId.toNumber() + 1
    );
  });
  it("Add record with maximum allowed data size", async () => {
    const patientAccount = await patientProgram.account.patientAccount.fetch(
      patientPda
    );
    const recordId = patientAccount.recordCount;

    const [medicalRecordPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("record"),
        patientWallet.publicKey.toBuffer(),
        new anchor.BN(recordId).toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    // Test data with maximum allowed sizes
    const maxIpfsHash = "A".repeat(46); // Assuming 46 is the max length for IPFS hash
    const maxDescription = "D".repeat(200); // Assuming 200 is the max length for description
    const testData = {
      ipfsHash: maxIpfsHash,
      recordType: "imaging", // Valid record type
      description: maxDescription,
      encryptedKey: "E".repeat(128), // Assuming 128 is the max length for encrypted key
    };

    const tx = await patientProgram.methods
      .addMedicalRecord(
        recordId,
        testData.recordType,
        testData.description,
        testData.ipfsHash,
        testData.encryptedKey
      )
      .accounts({
        authority: patientWallet.publicKey,
        patientAccount: patientPda,
        medicalRecord: medicalRecordPda,
      })
      .rpc();
    console.log("Medical record with max data size added:", tx);

    const medicalRecordAccount =
      await patientProgram.account.medicalRecord.fetch(medicalRecordPda);

    assert.equal(
      medicalRecordAccount.authority.toString(),
      patientPda.toString()
    );
    expect(medicalRecordAccount.recordId.toNumber()).to.equal(
      recordId.toNumber()
    );
    assert.equal(medicalRecordAccount.ipfsHash, testData.ipfsHash);
    assert.equal(medicalRecordAccount.recordType, testData.recordType);
    assert.equal(medicalRecordAccount.description, testData.description);
    assert.equal(medicalRecordAccount.encryptedKey, testData.encryptedKey);
    assert.isTrue(medicalRecordAccount.createdAt.gt(new anchor.BN(0)));

    const updatedPatientAccount =
      await patientProgram.account.patientAccount.fetch(patientPda);
    expect(updatedPatientAccount.recordCount.toNumber()).to.equal(
      recordId.toNumber() + 1
    );
  });
  it("Add record with minimum allowed data size", async () => {
    const patientAccount = await patientProgram.account.patientAccount.fetch(
      patientPda
    );
    const recordId = patientAccount.recordCount;

    const [medicalRecordPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("record"),
        patientWallet.publicKey.toBuffer(),
        new anchor.BN(recordId).toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    // Test data with minimum allowed sizes
    const testData = {
      ipfsHash: "Qm", // Assuming 2 is the min length for IPFS hash
      recordType: "prescription", // Valid record type
      description: "A", // Assuming 1 is the min length for description
      encryptedKey: "K", // Assuming 1 is the min length for encrypted key
    };
    const tx = await patientProgram.methods
      .addMedicalRecord(
        recordId,
        testData.recordType,
        testData.description,
        testData.ipfsHash,
        testData.encryptedKey
      )
      .accounts({
        authority: patientWallet.publicKey,
        patientAccount: patientPda,
        medicalRecord: medicalRecordPda,
      })
      .rpc();
    console.log("Medical record with min data size added:", tx);

    const medicalRecordAccount =
      await patientProgram.account.medicalRecord.fetch(medicalRecordPda);

    assert.equal(
      medicalRecordAccount.authority.toString(),
      patientPda.toString()
    );
    expect(medicalRecordAccount.recordId.toNumber()).to.equal(
      recordId.toNumber()
    );
    assert.equal(medicalRecordAccount.ipfsHash, testData.ipfsHash);
    assert.equal(medicalRecordAccount.recordType, testData.recordType);
    assert.equal(medicalRecordAccount.description, testData.description);
    assert.equal(medicalRecordAccount.encryptedKey, testData.encryptedKey);
    assert.isTrue(medicalRecordAccount.createdAt.gt(new anchor.BN(0)));

    const updatedPatientAccount =
      await patientProgram.account.patientAccount.fetch(patientPda);
    expect(updatedPatientAccount.recordCount.toNumber()).to.equal(
      recordId.toNumber() + 1
    );
  });
  it("Add multiple records to the same patient account", async () => {
    const numberOfRecordsToAdd = 3;
    for (let i = 0; i < numberOfRecordsToAdd; i++) {
      const patientAccount = await patientProgram.account.patientAccount.fetch(
        patientPda
      );
      const recordId = patientAccount.recordCount;

      const [medicalRecordPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("record"),
          patientWallet.publicKey.toBuffer(),
          new anchor.BN(recordId).toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      const testData = {
        ipfsHash: `Hash${i}`,
        recordType: "lab_report",
        description: `Record number ${i}`,
        encryptedKey: `EncryptedKey${i}`,
      };

      const tx = await patientProgram.methods
        .addMedicalRecord(
          recordId,
          testData.recordType,
          testData.description,
          testData.ipfsHash,
          testData.encryptedKey
        )
        .accounts({
          authority: patientWallet.publicKey,
          patientAccount: patientPda,
          medicalRecord: medicalRecordPda,
        })
        .rpc();
      console.log(`Medical record ${i} added:`, tx);

      const medicalRecordAccount =
        await patientProgram.account.medicalRecord.fetch(medicalRecordPda);

      assert.equal(
        medicalRecordAccount.authority.toString(),
        patientPda.toString()
      );
      expect(medicalRecordAccount.recordId.toNumber()).to.equal(
        recordId.toNumber()
      );
      assert.equal(medicalRecordAccount.ipfsHash, testData.ipfsHash);
      assert.equal(medicalRecordAccount.recordType, testData.recordType);
      assert.equal(medicalRecordAccount.description, testData.description);
      assert.equal(medicalRecordAccount.encryptedKey, testData.encryptedKey);
      assert.isTrue(medicalRecordAccount.createdAt.gt(new anchor.BN(0)));

      const updatedPatientAccount =
        await patientProgram.account.patientAccount.fetch(patientPda);
      expect(updatedPatientAccount.recordCount.toNumber()).to.equal(
        recordId.toNumber() + 1
      );
    }
  });
  it("Add records with different types", async () => {
    const recordTypes = ["lab_report", "imaging", "prescription", "notes"];
    const initialPatientAccount =
      await patientProgram.account.patientAccount.fetch(patientPda);
    const initialRecordCount = initialPatientAccount.recordCount.toNumber();
    for (const recordType of recordTypes) {
      const patientAccount = await patientProgram.account.patientAccount.fetch(
        patientPda
      );
      const recordId = patientAccount.recordCount;

      const [medicalRecordPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("record"),
          patientWallet.publicKey.toBuffer(),
          new anchor.BN(recordId).toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      const testData = {
        ipfsHash: `Hash_${recordType}`,
        recordType: recordType,
        description: `Description for ${recordType}`,
        encryptedKey: `EncryptedKey_${recordType}`,
      };

      const tx = await patientProgram.methods
        .addMedicalRecord(
          recordId,
          testData.recordType,
          testData.description,
          testData.ipfsHash,
          testData.encryptedKey
        )
        .accounts({
          authority: patientWallet.publicKey,
          patientAccount: patientPda,
          medicalRecord: medicalRecordPda,
        })
        .rpc();
      console.log(`Medical record of type ${recordType} added:`, tx);

      const medicalRecordAccount =
        await patientProgram.account.medicalRecord.fetch(medicalRecordPda);

      assert.equal(
        medicalRecordAccount.authority.toString(),
        patientPda.toString()
      );
      expect(medicalRecordAccount.recordId.toNumber()).to.equal(
        recordId.toNumber()
      );
      assert.equal(medicalRecordAccount.ipfsHash, testData.ipfsHash);
      assert.equal(medicalRecordAccount.recordType, testData.recordType);
      assert.equal(medicalRecordAccount.description, testData.description);
      assert.equal(medicalRecordAccount.encryptedKey, testData.encryptedKey);
      assert.isTrue(medicalRecordAccount.createdAt.gt(new anchor.BN(0)));
    }

    const finalPatientAccount =
      await patientProgram.account.patientAccount.fetch(patientPda);
    expect(finalPatientAccount.recordCount.toNumber()).to.equal(
      initialRecordCount + recordTypes.length
    );
  });
  it("Add record with empty IPFS hash should fail", async () => {
    const patientAccount = await patientProgram.account.patientAccount.fetch(
      patientPda
    );
    const recordId = patientAccount.recordCount;

    const [medicalRecordPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("record"),
        patientWallet.publicKey.toBuffer(),
        new anchor.BN(recordId).toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    const testData = {
      ipfsHash: "", // Empty IPFS hash
      recordType: "prescription", // Valid record type
      description: "A",
      encryptedKey: "K",
    };
    try {
      await patientProgram.methods
        .addMedicalRecord(
          recordId,
          testData.recordType,
          testData.description,
          testData.ipfsHash,
          testData.encryptedKey
        )
        .accounts({
          authority: patientWallet.publicKey,
          patientAccount: patientPda,
          medicalRecord: medicalRecordPda,
        })
        .rpc();
    } catch (error) {
      return;
    }

    throw new Error("Adding record with empty IPFS hash should fail");
  });
  it("Add record with IPFS hash exceeding maximum length should fail", async () => {
    const patientAccount = await patientProgram.account.patientAccount.fetch(
      patientPda
    );
    const recordId = patientAccount.recordCount;

    const [medicalRecordPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("record"),
        patientWallet.publicKey.toBuffer(),
        new anchor.BN(recordId).toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    const testData = {
      ipfsHash: "A".repeat(100), // Exceeding max length
      recordType: "prescription", // Valid record type
      description: "A",
      encryptedKey: "K",
    };
    try {
      await patientProgram.methods
        .addMedicalRecord(
          recordId,
          testData.recordType,
          testData.description,
          testData.ipfsHash,
          testData.encryptedKey
        )
        .accounts({
          authority: patientWallet.publicKey,
          patientAccount: patientPda,
          medicalRecord: medicalRecordPda,
        })
        .rpc();
    } catch (error) {
      return;
    }

    throw new Error(
      "Adding record with IPFS hash exceeding maximum length should fail"
    );
  });
  it("Add record with description exceeding maximum length should fail", async () => {
    const patientAccount = await patientProgram.account.patientAccount.fetch(
      patientPda
    );
    const recordId = patientAccount.recordCount;

    const [medicalRecordPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("record"),
        patientWallet.publicKey.toBuffer(),
        new anchor.BN(recordId).toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    const testData = {
      ipfsHash: "QmValidHash",
      recordType: "prescription", // Valid record type
      description: "D".repeat(300), // Exceeding max length
      encryptedKey: "K",
    };
    try {
      await patientProgram.methods
        .addMedicalRecord(
          recordId,
          testData.recordType,
          testData.description,
          testData.ipfsHash,
          testData.encryptedKey
        )
        .accounts({
          authority: patientWallet.publicKey,
          patientAccount: patientPda,
          medicalRecord: medicalRecordPda,
        })
        .rpc();
    } catch (error) {
      return;
    }

    throw new Error(
      "Adding record with description exceeding maximum length should fail"
    );
  });
});
