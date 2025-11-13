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
  
  // Private utility methods
  /**
   * Export CryptoKey to base64 string
   * @param {CryptoKey} key The CryptoKey to export
   * @returns {Promise<string>} The exported key in base64 format
   * @example
   * const base64Key = await CryptoUtils.exportKey(cryptoKey);
   * console.log(base64Key);
   */
  private static async exportKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey(key.type === 'public' ? 'spki' : 'pkcs8', key)
    return this.arrayBufferToBase64(exported)
  }

  /**
   * Import RSA public key from base64 string
   * @param {string} base64Key The base64 encoded RSA public key
   * @returns {Promise<CryptoKey>} The imported CryptoKey
   * @example
   * const publicKey = await CryptoUtils.importPublicKey('base64PublicKey');
   * console.log(publicKey);
   */
  private static async importPublicKey(base64Key: string): Promise<CryptoKey> {
    const keyData = this.base64ToArrayBuffer(base64Key)
    return await crypto.subtle.importKey(
      'spki',
      keyData,
      {
        name: this.RSA_ALGORITHM,
        hash: this.HASH_ALGORITHM,
      },
      true,
      ['encrypt'],
    )
  }

  /**
   * Import RSA private key from base64 string
   * @param {string} base64Key The base64 encoded RSA private key
   * @returns {Promise<CryptoKey>} The imported CryptoKey
   * @example
   * const privateKey = await CryptoUtils.importPrivateKey('base64PrivateKey');
   * console.log(privateKey);
   */
  private static async importPrivateKey(base64Key: string): Promise<CryptoKey> {
    const keyData = this.base64ToArrayBuffer(base64Key)
    return await crypto.subtle.importKey(
      'pkcs8',
      keyData,
      {
        name: this.RSA_ALGORITHM,
        hash: this.HASH_ALGORITHM,
      },
      true,
      ['decrypt'],
    )
  }

  /**
   * Import AES key from base64 string
   * @param {string} base64Key The base64 encoded AES key
   * @returns {Promise<CryptoKey>} The imported CryptoKey
   * @example
   * const aesKey = await CryptoUtils.importAESKey('base64AesKey');
   * console.log(aesKey);
   */
  private static async importAESKey(base64Key: string): Promise<CryptoKey> {
    const keyData = this.base64ToArrayBuffer(base64Key)
    return await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: this.AES_ALGORITHM, length: this.AES_KEY_LENGTH },
      true,
      ['encrypt', 'decrypt'],
    )
  }

  /**
   * Convert base64 string to ArrayBuffer
   * @param {string} base64 The base64 encoded string
   * @returns {ArrayBuffer} The decoded ArrayBuffer
   * @example
   * const arrayBuffer = CryptoUtils.base64ToArrayBuffer('base64String');
   * console.log(arrayBuffer);
   */
  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
  }

  /**
   * Convert ArrayBuffer or Uint8Array to base64 string
   * @param {ArrayBuffer | Uint8Array} buffer The input buffer
   * @returns {string} The base64 encoded string
   * @example
   * const base64String = CryptoUtils.arrayBufferToBase64(arrayBuffer);
   * console.log(base64String);
   */
  private static arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i] ?? 0)
    }
    return btoa(binary)
  }

  /**
   * Convert ArrayBuffer or Uint8Array to hex string
   * @param {ArrayBuffer | Uint8Array} buffer The input buffer
   * @returns {string} The hex encoded string
   * @example
   * const hexString = CryptoUtils.arrayBufferToHex(arrayBuffer);
   * console.log(hexString);
   */
  private static arrayBufferToHex(buffer: ArrayBuffer | Uint8Array): string {
    const byteArray = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
    const hexParts: string[] = []
    for (let i = 0; i < byteArray.length; i++) {
      const hex = byteArray[i]?.toString(16)?.padStart(2, '0') ?? '00'
      hexParts.push(hex)
    }
    return hexParts.join('')
  }

  /**
   * Constant-time comparison to prevent timing attacks
   * @param {string} a First string
   * @param {string} b Second string
   * @returns {boolean} True if equal, false otherwise
   */
  private static constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false

    let result = 0
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i)
    }
    return result === 0
  }
}
