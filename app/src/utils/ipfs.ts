import { createHelia } from 'helia'
import { unixfs } from '@helia/unixfs'

/**
 * IPFSClient provides methods to upload and download files to/from IPFS using Helia and UnixFS.
 * @example
 * const ipfsClient = new IPFSClient();
 * await ipfsClient.init();
 * const cid = await ipfsClient.uploadFile(encryptedData);
 * const fileData = await ipfsClient.downloadFile(cid);
 */
export class IPFSClient {
  private helia: any
  private fs: any

  /**
   * Initializes the Helia IPFS client and UnixFS instance.
   */
  async init() {
    // Create Helia instance in the browser
    this.helia = await createHelia()
    this.fs = unixfs(this.helia)
  }

  /**
   * Uploads an encrypted file to IPFS and returns its CID.
   * @param encryptedData - The encrypted file data as a Uint8Array.
   * @returns The CID of the uploaded file as a string.
   * @throws Error if the upload fails.
   * @example
   * const cid = await ipfsClient.uploadFile(encryptedData);
   * console.log(`File uploaded with CID: ${cid}`);
   */
  async uploadFile(encryptedData: Uint8Array): Promise<string> {
    const cid = await this.fs.addBytes(encryptedData)
    return cid.toString()
  }

  /**
   * Downloads a file from IPFS using its CID.
   * @param cid - The CID of the file to download.
   * @returns The downloaded file data as a Uint8Array.
   * @throws Error if the download fails.
   * @example
   * const fileData = await ipfsClient.downloadFile(cid);
   * console.log('File downloaded:', fileData);
   */
  async downloadFile(cid: string): Promise<Uint8Array> {
    const chunks = []
    for await (const chunk of this.fs.cat(cid)) {
      chunks.push(chunk)
    }
    return new Uint8Array(await new Blob(chunks).arrayBuffer())
  }
}

export const ipfsClient = new IPFSClient()
