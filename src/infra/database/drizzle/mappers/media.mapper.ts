import { Media } from "../../../../domain/media/entities/Media";
import type { Status } from "../../../../domain/media/entities/Status";
import type { MediaRow } from "../schema";

export namespace MediaMapper {
  export function toDomain(row: MediaRow): Media {
    return Media.create(
      {
        filename: row.filename,
        url: row.url,
        storageKey: row.storageKey ?? undefined,
        type: row.type,
        prompt: row.prompt ?? undefined,
        transcription: row.transcription ?? undefined,
        status: row.status as Status,
        language: row.language,
        duration: row.duration,
        summary: row.summary,
        summaryPrompt: row.summaryPrompt ?? undefined,
        summaryAttempts: row.summaryAttempts,
        transcriptionAttempts: row.transcriptionAttempts,
        usageDebitedAt: row.usageDebitedAt ?? undefined,
        segments: row.segments,
        tags: row.tags,
        userId: row.userId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }

  export function toPersistence(media: Media) {
    return {
      filename: media.filename,
      url: media.url,
      storageKey: media.storageKey,
      type: media.type,
      prompt: media.prompt,
      transcription: media.transcription,
      status: media.status ?? "pending_transcription",
      language: media.language,
      duration: media.duration,
      summary: media.summary ?? [],
      summaryPrompt: media.summaryPrompt,
      summaryAttempts: media.summaryAttempts,
      transcriptionAttempts: media.transcriptionAttempts,
      usageDebitedAt: media.usageDebitedAt,
      segments: media.segments ?? [],
      tags: media.tags ?? [],
      userId: media.userId,
      createdAt: media.createdAt,
      updatedAt: media.updatedAt,
    };
  }
}
