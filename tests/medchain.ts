import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Medchain } from "../target/types/medchain";
import { expect, assert } from "chai";

describe("medchain", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.medchain as Program<Medchain>;

  const patientWallet = provider.wallet;
  let patientPda: anchor.web3.PublicKey;

  it("Initialize Patient Account", async () => {
    [patientPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("patient"), patientWallet.publicKey.toBuffer()],
      program.programId
    );

    const patientName = "John Doe";
    const tx = await program.methods
      .initializePatient(patientName)
      .accounts({ user: patientWallet.publicKey, patientAccount: patientPda })
      .rpc();

    console.log("Patient account initialized with tx:", tx);

    // Fetch the patient account and verify the data
    const patientAccount = await program.account.patientAccount.fetch(
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

  it("Add Medical Record", async () => {
    [patientPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("patient"), patientWallet.publicKey.toBuffer()],
      program.programId
    );

    // Get current record count to use as record_id
    const patientAccount = await program.account.patientAccount.fetch(
      patientPda
    );
    const recordId = patientAccount.recordCount;

    // Derive medical record PDA
    const [medicalRecordPda] = anchor.web3.PublicKey.findProgramAddressSync(
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
    const tx = await program.methods
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
    const medicalRecordAccount = await program.account.medicalRecord.fetch(
      medicalRecordPda
    );

    assert.equal(
      medicalRecordAccount.patient.toString(),
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
    const updatedPatientAccount = await program.account.patientAccount.fetch(
      patientPda
    );
    expect(updatedPatientAccount.recordCount.toNumber()).to.equal(
      recordId.toNumber() + 1
    );
  });

  it("Grants Access to Medical Record", async () => {
    [patientPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("patient"), patientWallet.publicKey.toBuffer()],
      program.programId
    );

    // Get current record count to use as record_id
    const patientAccount = await program.account.patientAccount.fetch(
      patientPda
    );
    const recordId = patientAccount.recordCount.sub(new anchor.BN(1));

    // Derive medical record PDA
    const [medicalRecordPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("record"),
        patientWallet.publicKey.toBuffer(),
        new anchor.BN(recordId).toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    // New doctor wallet to grant access
    const doctorKeypair = anchor.web3.Keypair.generate();
    const doctorPubkey = doctorKeypair.publicKey;

    const durationInDays = 5;
    const encryptedKeyForDoctor = "g18EWbM/2ESEApo4E5c0dQ==";

    // Grant access
    const tx = await program.methods
      .grantAccess(
        doctorPubkey,
        new anchor.BN(durationInDays),
        encryptedKeyForDoctor
      )
      .accounts({
        authority: patientWallet.publicKey,
        patientAccount: patientPda,
        medicalRecord: medicalRecordPda,
      })
      .rpc();
    console.log("Access granted to doctor:", tx);

    // Fetch all access grants with the given doctorPubkey
    const accessEntry = await program.account.accessGrant
      .all()
      .then((entries) => {
        return entries.find(
          (entry) => entry.account.doctor.toString() === doctorPubkey.toString()
        );
      });
    assert.isDefined(accessEntry, "Access entry for doctor not found");
    expect(accessEntry.account.record.toString()).to.eq(
      medicalRecordPda.toString()
    );
  });
});
