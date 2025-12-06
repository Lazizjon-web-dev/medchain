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
  let doctorPda: anchor.web3.PublicKey;

  it("Initialize Doctor Account", async () => {
    [doctorPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("doctor"), patientWallet.publicKey.toBuffer()],
      program.programId
    );

    const doctorName = "Dr. Smith";
    const specialization = "Cardiology";
    const licenseId = "MED123456";
    const tx = await program.methods
      .initializeDoctor(doctorName, specialization, licenseId)
      .accounts({
        authority: patientWallet.publicKey,
        doctorAccount: doctorPda,
      })
      .rpc();

    console.log("Doctor account initialized with tx:", tx);

    // Fetch the doctor account and verify the data
    const doctorAccount = await program.account.doctorAccount.fetch(doctorPda);
    // Verify the account data
    expect(doctorAccount.authority.toString()).to.equal(
      patientWallet.publicKey.toString()
    );
    expect(doctorAccount.name).to.equal(doctorName);
    expect(doctorAccount.specialization).to.equal(specialization);
    expect(doctorAccount.licenseId).to.equal(licenseId);
    expect(doctorAccount.createdAt.toNumber()).to.be.above(0); // Should be recent timestamp
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
