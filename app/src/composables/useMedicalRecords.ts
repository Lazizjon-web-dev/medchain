import { useWallet } from './useWallet'
import { IPFSClient } from '../utils/ipfs'
import { useAnchorProgram } from './useAnchorProgram'
import { CryptoUtils as cryptoUtils } from '../utils/crypto'
import { FileUtils as fileUtils } from '../utils/file'
import { TypeUtils as typeUtils } from '../utils/type'
export async function useMedicalRecords() {
  // Get current record ID from patient account (stubbed here)
  const currentRecordId = 0 // This should be fetched from the patient's on-chain account

  // Get wallet and program instances
  const { connected, publicKey } = useWallet()
  const { program } = useAnchorProgram()
  // Ensure wallet is connected
  if (!connected.value || !publicKey.value) {
    throw new Error('Wallet not connected')
  }
  if (!program || !program.methods) {
    throw new Error('Anchor program not initialized')
  }

  // Initialize IPFS client
  const ipfsClient = new IPFSClient()
  await ipfsClient.init()

  const uploadMedicalRecord = async (file: File, recordType: string, description: string) => {
    // 1. Generate symmetric encryption key
    const symmetricKey = (await cryptoUtils.generateAESKey()).key

    // 2. Encrypt file with symmetric key
    const encryptedFile = (
      await cryptoUtils.encryptWithAES(await fileUtils.readFileAsText(file), symmetricKey)
    ).encryptedData

    // 3. Upload encrypted file to IPFS
    const ipfsHash = await ipfsClient.uploadFile(typeUtils.base64ToUint8Array(encryptedFile))

    // 4. Encrypt symmetric key with patient's public key
    const encryptedSymmetricKey = await cryptoUtils.encryptWithAES(symmetricKey, publicKey.value!)

    // 5. Call Anchor program to store metadata on-chain
    await program.methods
      .add_medical_record(
        currentRecordId, // Get from patient account
        ipfsHash,
        recordType,
        description,
        encryptedSymmetricKey,
        new BN(file.size),
      )
      .rpc()
  }

  return { uploadMedicalRecord }
}
