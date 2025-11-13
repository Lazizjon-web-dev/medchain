export class TypeUtils {
  /**
   * Convert base64 string to Uint8Array
   * @param {string} base64 The base64 encoded string
   * @returns {Uint8Array} The decoded Uint8Array
   * @example
   * const uint8Array = TypeUtils.base64ToUint8Array('base64String');
   * console.log(uint8Array);
   */
  public static base64ToUint8Array(base64: string): Uint8Array {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes
  }
  
  /**
   * Convert base64 string to ArrayBuffer
   * @param {string} base64 The base64 encoded string
   * @returns {ArrayBuffer} The decoded ArrayBuffer
   * @example
   * const arrayBuffer = CryptoUtils.base64ToArrayBuffer('base64String');
   * console.log(arrayBuffer);
   */
  public static base64ToArrayBuffer(base64: string): ArrayBuffer {
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
  public static arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
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
  public static arrayBufferToHex(buffer: ArrayBuffer | Uint8Array): string {
    const byteArray = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
    const hexParts: string[] = []
    for (let i = 0; i < byteArray.length; i++) {
      const hex = byteArray[i]?.toString(16)?.padStart(2, '0') ?? '00'
      hexParts.push(hex)
    }
    return hexParts.join('')
  }
}
