import type { Status as ContractStatus } from "../../../contracts";
import type { Media, Segment } from "../../../domain";

export type { ContractStatus as Status };

export interface MediaPresenterResponse {
  id: string;
  filename: string;
  url: string;
  storageKey?: string;
  type?: "video" | "audio";
  prompt?: string;
  language: string;
  transcription?: string;
  duration: number;
  summary: string[];
  summaryPrompt?: string;
  summaryAttempts?: number;
  transcriptionAttempts?: number;
  status: ContractStatus;
  tags: string[];
  segments: Segment[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MediasPresenterResponse {
  medias: MediaPresenterResponse[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

export namespace MediaPresenter {
  export function toHTTP(media: Media): MediaPresenterResponse {
    return {
      id: media.id,
      filename: media.filename,
      url: media.url,
      storageKey: media.storageKey,
      type: media.type,
      prompt: media.prompt,
      transcription: media.transcription,
      language: media.language,
      duration: media.duration,
      summary: media.summary ?? [],
      summaryPrompt: media.summaryPrompt,
      summaryAttempts: media.summaryAttempts,
      transcriptionAttempts: media.transcriptionAttempts,
      status: (media.status ?? "pending_transcription") as ContractStatus,
      tags: media.tags ?? [],
      segments: media.segments ?? [],
      createdAt: media.createdAt,
      updatedAt: media.updatedAt,
    };
  }

  export function toHTTPCollection(
    medias: Media[],
    pagination?: MediasPresenterResponse["pagination"],
  ): MediasPresenterResponse {
    return {
      medias: medias.map(toHTTP),
      pagination: pagination ?? {
        page: 1,
        perPage: 20,
        total: medias.length,
        totalPages: 1,
      },
    };
  }
}
