import { beforeEach, describe, expect, it } from "vitest";

import { Media } from "../../media/entities/Media";
import { InMemoryMediaRepository } from "../../test";
import { FetchTagsUseCase } from "./fetch-tags";

describe("Fetch Tags Use Case", () => {
  let mediaRepository: InMemoryMediaRepository;
  let sut: FetchTagsUseCase;

  beforeEach(() => {
    mediaRepository = new InMemoryMediaRepository();
    sut = new FetchTagsUseCase(mediaRepository);
  });

  it("should fetch unique tags from user medias", async () => {
    const userId = "user-1";

    await mediaRepository.create(
      Media.create(
        {
          filename: "video-1.mp4",
          url: "http://example.com/video-1.mp4",
          type: "video",
          language: "en",
          duration: 120.5,
          status: "summarized",
          tags: ["tag1", "tag2"],
          userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        "media-1",
      ),
    );

    await mediaRepository.create(
      Media.create(
        {
          filename: "video-2.mp4",
          url: "http://example.com/video-2.mp4",
          type: "video",
          duration: 180.0,
          status: "summarized",
          tags: ["tag2", "tag3", "tag1"],
          userId,
          language: "en",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        "media-2",
      ),
    );

    const result = await sut.execute({ userId });

    expect(result.isRight()).toBe(true);
    expect(result.value).toEqual({
      tags: ["tag1", "tag2", "tag3"],
    });
  });

  it("should return empty array when user has no medias", async () => {
    const result = await sut.execute({ userId: "non-existent-user" });

    expect(result.isRight()).toBe(true);
    expect(result.value).toEqual({
      tags: [],
    });
  });
});
