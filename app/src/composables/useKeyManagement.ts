import { useWallet } from './useWallet'
import { useAnchorProgram } from './useAnchorProgram'
import { CryptoUtils as crypto } from '../utils/crypto'
import { FileUtils as file } from '../utils/file'
import { TypeUtils as typeUtils } from '../utils/type'
import { PublicKey } from '@solana/web3.js'
import { ipfsClient } from '../utils/ipfs'

export function useKeyManagement() {
  const { publicKey } = useWallet()
  const { program } = useAnchorProgram()

  const rotateRecordKey = async (
    medicalRecordPda: PublicKey,
    newFile: File, // Optional - if re-encrypting with new file
    doctorsToKeep: PublicKey[], // Which doctors should retain access
  ) => {
    // 1. Generate new symmetric key
    const newSymmetricKey = await crypto.generateRSAKeyPair()

    let newIpfsHash: string
    let reencryptedFile: Uint8Array

    if (newFile) {
      // 2A. Encrypt new file with new symmetric key
      reencryptedFile = typeUtils.base64ToUint8Array(
        await crypto.encryptWithRSA(newSymmetricKey.publicKey, await file.readFileAsText(newFile)),
      )
      // reencryptedFile = await encryptFile(newFile, newSymmetricKey);
    } else {
      // 2B. Or re-encrypt existing file
      const medicalRecord = await program.account.medicalRecord.fetch(medicalRecordPda)
      const currentSymmetricKey = await decryptWithPrivateKey(
        medicalRecord.encryptedKey,
      const currentFile = await ipfsClient.downloadFile(medicalRecord.ipfsHash)
        patientPrivateKey,
      )
      const decryptedFile = await decryptFile(currentFile, currentSymmetricKey)
      reencryptedFile = await encryptFile(decryptedFile, newSymmetricKey)
    }

    // 3. Upload re-encrypted file to IPFS
    newIpfsHash = await ipfsClient.uploadFile(reencryptedFile)

    // 4. Encrypt new symmetric key with patient's public key
    const newEncryptedKeyForPatient = await encryptWithPublicKey(newSymmetricKey, publicKey)

    // 5. Update MedicalRecord with new key and IPFS hash
    await program.methods
      .rotateRecordKey(newIpfsHash, newEncryptedKeyForPatient)
      .accounts({
        patient: publicKey,
        patientAccount: patientPda, // Derive this
        medicalRecord: medicalRecordPda,
      })
      .rpc()

    // 6. Update keys for selected doctors
    for (const doctorWallet of doctorsToKeep) {
      await updateDoctorKey(medicalRecordPda, doctorWallet, newSymmetricKey)
    }

    return newIpfsHash
  }

  const updateDoctorKey = async (
    medicalRecordPda: PublicKey,
    doctorWallet: PublicKey,
    newSymmetricKey: Uint8Array,
  ) => {
    // Encrypt new symmetric key with doctor's public key
    const newEncryptedKeyForDoctor = await encryptWithPublicKey(newSymmetricKey, doctorWallet)

    const [accessGrantPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('access_grant'), medicalRecordPda.toBuffer(), doctorWallet.toBuffer()],
      program.programId,
    )

    await program.methods
      .updateDoctorKey(doctorWallet, newEncryptedKeyForDoctor)
      .accounts({
        patient: publicKey,
        patientAccount: patientPda,
        medicalRecord: medicalRecordPda,
        accessGrant: accessGrantPda,
      })
      .rpc()
  }

  const revokeDoctorAccess = async (medicalRecordPda: PublicKey, doctorWallet: PublicKey) => {
    const [accessGrantPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('access_grant'), medicalRecordPda.toBuffer(), doctorWallet.toBuffer()],
      program.programId,
    )

    await program.methods
      .revokeAccess()
      .accounts({
        patient: publicKey,
        patientAccount: patientPda,
        accessGrant: accessGrantPda,
        medicalRecord: medicalRecordPda,
      })
      .rpc()
  }

  const bulkRotateKeys = async (
    medicalRecords: PublicKey[],
    doctorsToKeep: Map<PublicKey, PublicKey[]>, // Map of record PDA to array of doctor wallets to keep
  ) => {
    for (const recordPda of medicalRecords) {
      const doctorsForThisRecord = doctorsToKeep.get(recordPda) || []
      await rotateRecordKey(recordPda, null, doctorsForThisRecord)
    }
  }

  return {
    rotateRecordKey,
    updateDoctorKey,
    revokeDoctorAccess,
    bulkRotateKeys,
  }
}

