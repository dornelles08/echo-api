import { describe, expect, it } from "vitest";

import { Media } from "./Media";

const baseProps = {
  filename: "audio.mp3",
  url: "http://example.com/audio.mp3",
  type: "audio" as const,
  language: "pt-BR",
  duration: 120,
  userId: "user-123",
};

describe("Media entity", () => {
  it("applies sensible defaults on create", () => {
    const media = Media.create(baseProps);

    expect(media.status).toBe("pending_transcription");
    expect(media.tags).toEqual([]);
    expect(media.summaryAttempts).toBe(0);
    expect(media.createdAt).toBeInstanceOf(Date);
    expect(media.updatedAt).toBeInstanceOf(Date);
  });

  it("keeps explicitly provided values", () => {
    const media = Media.create({
      ...baseProps,
      status: "transcribed",
      tags: ["a", "b"],
      summaryAttempts: 2,
    });

    expect(media.status).toBe("transcribed");
    expect(media.tags).toEqual(["a", "b"]);
    expect(media.summaryAttempts).toBe(2);
  });

  it("incrementSummaryAttempts increments from zero and from an existing value", () => {
    const media = Media.create(baseProps);

    expect(media.summaryAttempts).toBe(0);
    media.incrementSummaryAttempts();
    expect(media.summaryAttempts).toBe(1);
    media.incrementSummaryAttempts();
    expect(media.summaryAttempts).toBe(2);
  });

  it("touch() refreshes updatedAt when mutable props change", async () => {
    const media = Media.create({ ...baseProps, updatedAt: new Date("2020-01-01") });

    media.transcription = "hello";
    expect(media.updatedAt?.getTime()).toBeGreaterThan(new Date("2020-01-01").getTime());

    media.summary = ["a"];
    media.summaryPrompt = "p";
    media.status = "summarized";
  });

  it("sets and gets mutable transcription, summary, status and summaryPrompt", () => {
    const media = Media.create(baseProps);

    media.transcription = "t";
    media.summary = ["s1", "s2"];
    media.status = "pending_summary";
    media.summaryPrompt = "prompt";

    expect(media.transcription).toBe("t");
    expect(media.summary).toEqual(["s1", "s2"]);
    expect(media.status).toBe("pending_summary");
    expect(media.summaryPrompt).toBe("prompt");
  });

  it("generates an id when not provided and keeps a provided id", () => {
    expect(Media.create(baseProps).id).toBeTruthy();
    expect(Media.create(baseProps, "media-1").id).toBe("media-1");
  });
});
