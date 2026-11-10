import { describe, expect, it } from "vitest";

import { Media } from "../../../domain";
import { MediaPresenter } from "./media.presenter";

describe("MediaPresenter.toHTTP", () => {
  it("maps a media entity to the HTTP shape with defaults", () => {
    const media = Media.create(
      {
        filename: "audio.mp3",
        url: "memory:///audio.mp3",
        type: "audio",
        language: "pt-BR",
        duration: 42,
        userId: "user-1",
      },
      "media-1",
    );

    const dto = MediaPresenter.toHTTP(media);

    expect(dto).toEqual({
      id: "media-1",
      filename: "audio.mp3",
      url: "memory:///audio.mp3",
      storageKey: undefined,
      type: "audio",
      prompt: undefined,
      transcription: undefined,
      language: "pt-BR",
      duration: 42,
      summary: [],
      summaryPrompt: undefined,
      summaryAttempts: 0,
      transcriptionAttempts: 0,
      status: "pending_transcription",
      tags: [],
      segments: [],
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });
});

describe("MediaPresenter.toHTTPCollection", () => {
  it("maps a collection preserving the provided pagination meta", () => {
    const media = Media.create(
      {
        filename: "audio.mp3",
        url: "memory:///audio.mp3",
        type: "audio",
        language: "pt-BR",
        duration: 42,
        userId: "user-1",
      },
      "media-1",
    );

    const dto = MediaPresenter.toHTTPCollection([media], {
      page: 2,
      perPage: 10,
      total: 21,
      totalPages: 3,
    });

    expect(dto.medias).toHaveLength(1);
    expect(dto.pagination).toEqual({ page: 2, perPage: 10, total: 21, totalPages: 3 });
  });

  it("falls back to a default pagination object when meta is not provided", () => {
    const dto = MediaPresenter.toHTTPCollection([]);

    expect(dto.pagination).toEqual({ page: 1, perPage: 20, total: 0, totalPages: 1 });
  });
});
