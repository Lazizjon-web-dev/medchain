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
      .accounts({ user: patientWallet.publicKey, patient_account: patientPda })
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
});
