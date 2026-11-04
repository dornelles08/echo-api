export interface StoredFile {
  /** Stable object key inside the bucket. Never expires. */
  key: string;
  /** Presigned URL used by clients to download the file. */
  url: string;
}

export interface StorageService {
  saveFile(content: Buffer | Uint8Array, filename: string): Promise<StoredFile>;
  readFile(key: string): Promise<Buffer>;
  deleteFile(key: string): Promise<void>;
}
