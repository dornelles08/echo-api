import { beforeEach, describe, expect, it } from "vitest";

import { EntityNotFoundError } from "../../errors/entity-not-found.error";
import { InMemoryMediaRepository, makeMediaFactory } from "../../test";
import { GetMediaUseCase } from "./get-medias";

let inMemoryMediaRepository: InMemoryMediaRepository;
let sut: GetMediaUseCase;

describe("Fetch Media", () => {
  beforeEach(() => {
    inMemoryMediaRepository = new InMemoryMediaRepository();
    sut = new GetMediaUseCase(inMemoryMediaRepository);
  });

  it("should be able to get a media", async () => {
    const media = makeMediaFactory({
      userId: "user-123",
    });
    await inMemoryMediaRepository.create(media);

    const result = await sut.execute({
      userId: "user-123",
      mediaId: media.id,
    });

    expect(result.isRight()).toBe(true);
    expect(result.value).toEqual({
      media: expect.objectContaining({
        id: media.id,
        userId: "user-123",
      }),
    });
  });

  it("should not be able to get unexists media", async () => {
    const result = await sut.execute({
      userId: "user-123",
      mediaId: "non-existing-media-id",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(EntityNotFoundError);
  });
});
