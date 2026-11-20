import { Upload } from "../../../../domain/file/entities/Upload";
import type { UploadRow } from "../schema";

export namespace UploadMapper {
  export function toDomain(row: UploadRow): Upload {
    return Upload.create(
      {
        userId: row.userId,
        storageKey: row.storageKey,
        filename: row.filename,
        type: row.type as "audio" | "video",
        durationSeconds: row.durationSeconds,
        consumedAt: row.consumedAt ?? undefined,
        createdAt: row.createdAt,
      },
      row.id,
    );
  }

  export function toPersistence(upload: Upload) {
    return {
      userId: upload.userId,
      storageKey: upload.storageKey,
      filename: upload.filename,
      type: upload.type,
      durationSeconds: upload.durationSeconds,
      consumedAt: upload.consumedAt,
      createdAt: upload.createdAt,
    };
  }
}
