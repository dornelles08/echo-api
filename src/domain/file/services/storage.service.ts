import type { Readable } from "node:stream";

export interface StoredFile {
  /** Stable object key inside the bucket. Never expires. */
  key: string;
  /** Presigned URL used by clients to download the file. */
  url: string;
}

export interface StorageService {
  /**
   * Salva um arquivo no storage. Aceita `Buffer`, `Uint8Array` ou um
   * `ReadableStream` (stream do multipart do Fastify), evitando carregar
   * arquivos grandes inteiramente na memória.
   */
  saveFile(content: Buffer | Uint8Array | Readable, filename: string): Promise<StoredFile>;
  readFile(key: string): Promise<Buffer>;
  deleteFile(key: string): Promise<void>;
}
