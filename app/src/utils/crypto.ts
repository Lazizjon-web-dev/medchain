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

  /**
   * Generate a secure RSA key pair for asymmetric encryption
   * @returns {Promise<KeyPair>} The generated RSA key pair
   * @throws {Error} If key generation fails
   * @example
   * const keyPair = await CryptoUtils.generateRSAKeyPair();
   * console.log(keyPair.publicKey);
   * console.log(keyPair.privateKey);
   * @example
   * const { publicKey, privateKey } = await CryptoUtils.generateRSAKeyPair();
   * console.log(publicKey);
   * console.log(privateKey);
   */
  static async generateRSAKeyPair(): Promise<KeyPair> {
    try {
      const keyPair = await crypto.subtle.generateKey(
        {
          name: this.RSA_ALGORITHM,
          modulusLength: this.RSA_MODULUS_LENGTH,
          publicExponent: new Uint8Array([0x01, 0x00, 0x01]), // 65537
          hash: this.HASH_ALGORITHM,
        },
        true, // extractable
        ['encrypt', 'decrypt'],
      )

      const publicKey = await this.exportKey(keyPair.publicKey)
      const privateKey = await this.exportKey(keyPair.privateKey)

      return { publicKey, privateKey }
    } catch (error) {
      throw new Error(
        `RSA key generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Generate a secure AES key for symmetric encryption
   * @returns {Promise<AesKeyResult>} The generated AES key and salt
   * @throws {Error} If key generation fails
   * @example
   * const aesKeyResult = await CryptoUtils.generateAESKey();
   * console.log(aesKeyResult.key);
   * console.log(aesKeyResult.salt);
   * @example
   * const { key, salt } = await CryptoUtils.generateAESKey();
   * console.log(key);
   * console.log(salt);
   */
  static async generateAESKey(): Promise<AesKeyResult> {
    try {
      const salt = this.generateRandomBytes(this.SALT_LENGTH)
      const randomBytes = Buffer.from(this.generateRandomBytes(32))
      const keyMaterial = await crypto.subtle.importKey('raw', randomBytes, 'PBKDF2', false, [
        'deriveKey',
      ])

      const key = await crypto.subtle.deriveKey(
        {
          name: this.KEY_DERIVATION_ALGORITHM,
          salt: Buffer.from(salt),
          iterations: this.ITERATIONS,
          hash: this.HASH_ALGORITHM,
        },
        keyMaterial,
        { name: this.AES_ALGORITHM, length: this.AES_KEY_LENGTH },
        true,
        ['encrypt', 'decrypt'],
      )

      const exportedKey = await this.exportKey(key)
      const saltBase64 = this.arrayBufferToBase64(salt)

      return { key: exportedKey, salt: saltBase64 }
    } catch (error) {
      throw new Error(
        `AES key generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Derive AES key from password using PBKDF2
   * @param {string} password The password to derive the key from
   * @param {string} salt The salt to use in key derivation (base64 encoded)
   * @returns {Promise<string>} The derived AES key (base64 encoded)
   * @throws {Error} If key derivation fails
   * @example
   * const derivedKey = await CryptoUtils.deriveKeyFromPassword('myPassword', 'base64Salt');
   * console.log(derivedKey);
   */
  static async deriveKeyFromPassword(password: string, salt: string): Promise<string> {
    try {
      const encoder = new TextEncoder()
      const passwordBuffer = encoder.encode(password)
      const saltBuffer = this.base64ToArrayBuffer(salt)

      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        this.KEY_DERIVATION_ALGORITHM,
        false,
        ['deriveKey'],
      )

      const key = await crypto.subtle.deriveKey(
        {
          name: this.KEY_DERIVATION_ALGORITHM,
          salt: saltBuffer,
          iterations: this.ITERATIONS,
          hash: this.HASH_ALGORITHM,
        },
        keyMaterial,
        { name: this.AES_ALGORITHM, length: this.AES_KEY_LENGTH },
        true,
        ['encrypt', 'decrypt'],
      )

      return await this.exportKey(key)
    } catch (error) {
      throw new Error(
        `Key derivation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Encrypt data with RSA public key
   * @param {string} publicKey The RSA public key (base64 encoded)
   * @param {string} data The data to encrypt
   * @returns {Promise<string>} The encrypted data (base64 encoded)
   * @throws {Error} If encryption fails
   * @example
   * const encryptedData = await CryptoUtils.encryptWithRSA(publicKey, 'myData');
   * console.log(encryptedData);
   */
  static async encryptWithRSA(publicKey: string, data: string): Promise<string> {
    try {
      const key = await this.importPublicKey(publicKey)
      const encoder = new TextEncoder()
      const dataBuffer = encoder.encode(data)

      const encrypted = await crypto.subtle.encrypt({ name: this.RSA_ALGORITHM }, key, dataBuffer)

      return this.arrayBufferToBase64(encrypted)
    } catch (error) {
      throw new Error(
        `RSA encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Decrypt data with RSA private key
   * @param {string} privateKey The RSA private key (base64 encoded)
   * @param {string} encryptedData The data to decrypt (base64 encoded)
   * @returns {Promise<string>} The decrypted data
   * @throws {Error} If decryption fails
   * @example
   * const decryptedData = await CryptoUtils.decryptWithRSA(privateKey, encryptedData);
   * console.log(decryptedData);
   */
  static async decryptWithRSA(privateKey: string, encryptedData: string): Promise<string> {
    try {
      const key = await this.importPrivateKey(privateKey)
      const encryptedBuffer = this.base64ToArrayBuffer(encryptedData)

      const decrypted = await crypto.subtle.decrypt(
        { name: this.RSA_ALGORITHM },
        key,
        encryptedBuffer,
      )

      const decoder = new TextDecoder()
      return decoder.decode(decrypted)
    } catch (error) {
      throw new Error(
        `RSA decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Encrypt data with AES key
   * @param {string} key The AES key (base64 encoded)
   * @param {string} data The data to encrypt
   * @returns {Promise<EncryptionResult>} The encrypted data, IV, and salt
   * @throws {Error} If encryption fails
   * @example
   * const encryptionResult = await CryptoUtils.encryptWithAES(aesKey, 'myData');
   * console.log(encryptionResult.encryptedData);
   * console.log(encryptionResult.iv);
   * console.log(encryptionResult.salt); // Not used for pre-derived keys
   */
  static async encryptWithAES(key: string, data: string): Promise<EncryptionResult> {
    try {
      const cryptoKey = await this.importAESKey(key)
      const iv = Buffer.from(this.generateRandomBytes(this.IV_LENGTH))
      const encoder = new TextEncoder()
      const dataBuffer = encoder.encode(data)
      //const salt = this.arrayBufferToBase64(this.generateRandomBytes(this.SALT_LENGTH))

      const encrypted = await crypto.subtle.encrypt(
        {
          name: this.AES_ALGORITHM,
          iv: iv,
        },
        cryptoKey,
        dataBuffer,
      )

      return {
        encryptedData: this.arrayBufferToBase64(encrypted),
        iv: this.arrayBufferToBase64(iv),
        salt: '', // Not used for pre-derived keys
      }
    } catch (error) {
      throw new Error(
        `AES encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Decrypt data with AES key
   * @param {string} key The AES key (base64 encoded)
   * @param {string} encryptedData The data to decrypt (base64 encoded)
   * @param {string} iv The initialization vector (base64 encoded)
   * @returns {Promise<string>} The decrypted data
   * @throws {Error} If decryption fails
   * @example
   * const decryptedData = await CryptoUtils.decryptWithAES(aesKey, encryptedData, iv);
   * console.log(decryptedData);
   */
  static async decryptWithAES(key: string, encryptedData: string, iv: string): Promise<string> {
    try {
      const cryptoKey = await this.importAESKey(key)
      const encryptedBuffer = this.base64ToArrayBuffer(encryptedData)
      const ivBuffer = this.base64ToArrayBuffer(iv)

      const decrypted = await crypto.subtle.decrypt(
        {
          name: this.AES_ALGORITHM,
          iv: ivBuffer,
        },
        cryptoKey,
        encryptedBuffer,
      )

      const decoder = new TextDecoder()
      return decoder.decode(decrypted)
    } catch (error) {
      throw new Error(
        `AES decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Generate cryptographically secure random bytes
   * @param length Number of bytes to generate
   * @returns Uint8Array of random bytes
   * @example
   * const randomBytes = CryptoUtils.generateRandomBytes(16);
   * console.log(randomBytes);
   */
  static generateRandomBytes(length: number): Uint8Array {
    const array = new Uint8Array(length) // value range 0-255
    crypto.getRandomValues(array)
    return array
  }

  /**
   * Generate secure random hash
   * @param {number} length Length of the hash in characters (default: 32)
   * @returns {Promise<string>} The generated random hash
   * @example
   * const randomHash = await CryptoUtils.generateRandomHash(32);
   * console.log(randomHash);
   */
  static async generateRandomHash(length: number = 32): Promise<string> {
    const randomBytes = this.generateRandomBytes(length)
    const hashBuffer = await crypto.subtle.digest(this.HASH_ALGORITHM, Buffer.from(randomBytes))
    return this.arrayBufferToHex(hashBuffer).substring(0, length)
  }

  /**
   * Create SHA-256 hash of data
   * @param {string} data The input data
   * @returns {Promise<string>} The hex encoded hash
   * @example
   * const hash = await CryptoUtils.hashData('myData');
   * console.log(hash);
   */
  static async hashData(data: string): Promise<string> {
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    const hashBuffer = await crypto.subtle.digest(this.HASH_ALGORITHM, dataBuffer)
    return this.arrayBufferToHex(hashBuffer)
  }

  /**
   * Verify data against hash
   * @param {string} data The original data
   * @param {string} hash The hash to verify against
   * @returns {Promise<boolean>} True if data matches hash, false otherwise
   * @example
   * const isValid = await CryptoUtils.verifyHash('myData', 'expectedHash');
   * console.log(isValid);
   */
  static async verifyHash(data: string, hash: string): Promise<boolean> {
    const dataHash = await this.hashData(data)
    return this.constantTimeCompare(dataHash, hash)
  }

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
