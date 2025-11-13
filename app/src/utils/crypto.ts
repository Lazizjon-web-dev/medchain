import { Buffer } from 'buffer'
export interface KeyPair {
  publicKey: string
  privateKey: string
}

export interface EncryptionResult {
  encryptedData: string
  iv: string
  salt: string
}

export interface AesKeyResult {
  key: string
  salt: string
}

export class CryptoUtils {
  private static readonly AES_ALGORITHM = 'AES-GCM'
  private static readonly RSA_ALGORITHM = 'RSA-OAEP'
  private static readonly HASH_ALGORITHM = 'SHA-256'
  private static readonly KEY_DERIVATION_ALGORITHM = 'PBKDF2'
  private static readonly AES_KEY_LENGTH = 128 // bits
  private static readonly RSA_MODULUS_LENGTH = 2048 // preferably 4096 for higher security
  private static readonly IV_LENGTH = 12 // 96 bits for GCM
  private static readonly SALT_LENGTH = 16
  private static readonly ITERATIONS = 100000
}
