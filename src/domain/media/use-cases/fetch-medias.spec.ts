import { beforeEach, describe, expect, it } from "vitest";

import { InMemoryMediaRepository, makeMediaFactory } from "../../test";
import { FetchMediasUseCase } from "./fetch-medias";

let inMemoryMediaRepository: InMemoryMediaRepository;
let sut: FetchMediasUseCase;

describe("Fetch Media", () => {
  beforeEach(() => {
    inMemoryMediaRepository = new InMemoryMediaRepository();
    sut = new FetchMediasUseCase(inMemoryMediaRepository);
  });

  it("should be able to fetch medias", async () => {
    const media = makeMediaFactory({
      userId: "user-123",
    });
    await inMemoryMediaRepository.create(media);

    const result = await sut.execute({
      userId: "user-123",
      perPage: 10,
      page: 1,
    });

    expect(result.isRight()).toBe(true);
    expect(result.value).toEqual({
      medias: expect.arrayContaining([
        expect.objectContaining({
          id: media.id,
          userId: "user-123",
        }),
      ]),
      meta: expect.objectContaining({
        page: 1,
        perPage: 10,
        total: 1,
        totalPages: 1,
      }),
    });
  });

  it("should return an empty list when the user has no medias", async () => {
    const result = await sut.execute({
      userId: "user-123",
      perPage: 10,
      page: 1,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.medias).toEqual([]);
      expect(result.value.meta).toEqual({
        page: 1,
        perPage: 10,
        total: 0,
        totalPages: 0,
      });
    }
  });

  it("should not return medias that belong to another user", async () => {
    await inMemoryMediaRepository.create(makeMediaFactory({ userId: "user-123" }));
    await inMemoryMediaRepository.create(makeMediaFactory({ userId: "user-456" }));

    const result = await sut.execute({
      userId: "user-123",
      perPage: 10,
      page: 1,
    });

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.medias).toHaveLength(1);
      expect(result.value.medias[0]?.userId).toBe("user-123");
      expect(result.value.meta.total).toBe(1);
    }
  });

  it("should filter medias by type video", async () => {
    await inMemoryMediaRepository.create(makeMediaFactory({ userId: "user-123", type: "video" }));
    await inMemoryMediaRepository.create(makeMediaFactory({ userId: "user-123", type: "video" }));
    await inMemoryMediaRepository.create(makeMediaFactory({ userId: "user-123", type: "audio" }));

    const result = await sut.execute({
      userId: "user-123",
      perPage: 10,
      page: 1,
      type: "video",
    });

    expect(result.isRight()).toBe(true);
    expect(result.value?.medias).toHaveLength(2);
    expect(result.value?.medias.every((media) => media.type === "video")).toBe(true);
    expect(result.value?.meta.total).toBe(2);
  });

  it("should filter medias by type audio", async () => {
    await inMemoryMediaRepository.create(makeMediaFactory({ userId: "user-123", type: "video" }));
    await inMemoryMediaRepository.create(makeMediaFactory({ userId: "user-123", type: "audio" }));
    await inMemoryMediaRepository.create(makeMediaFactory({ userId: "user-123", type: "audio" }));

    const result = await sut.execute({
      userId: "user-123",
      perPage: 10,
      page: 1,
      type: "audio",
    });

    expect(result.isRight()).toBe(true);
    expect(result.value?.medias).toHaveLength(2);
    expect(result.value?.medias.every((media) => media.type === "audio")).toBe(true);
    expect(result.value?.meta.total).toBe(2);
  });

  it("should be able to fetch medias in portuguese", async () => {
    await inMemoryMediaRepository.create(
      makeMediaFactory({ userId: "user-123", type: "video", language: "pt-BR" }),
    );
    await inMemoryMediaRepository.create(
      makeMediaFactory({ userId: "user-123", type: "video", language: "en-US" }),
    );
    await inMemoryMediaRepository.create(
      makeMediaFactory({ userId: "user-123", type: "audio", language: "pt-BR" }),
    );

    const result = await sut.execute({
      userId: "user-123",
      perPage: 10,
      page: 1,
      type: "video",
      language: "pt-BR",
    });

    expect(result.isRight()).toBe(true);
    expect(result.value?.medias).toHaveLength(1);
    expect(result.value?.meta.total).toBe(1);
    expect(result.value?.meta.page).toBe(1);
    expect(result.value?.meta.perPage).toBe(10);
  });

  it("should filter medias by status", async () => {
    await inMemoryMediaRepository.create(
      makeMediaFactory({ userId: "user-123", status: "transcribed" }),
    );
    await inMemoryMediaRepository.create(
      makeMediaFactory({ userId: "user-123", status: "pending_transcription" }),
    );

    const result = await sut.execute({
      userId: "user-123",
      perPage: 10,
      page: 1,
      status: "pending_transcription",
    });

    expect(result.isRight()).toBe(true);
    expect(result.value?.meta.total).toBe(1);
    expect(result.value?.medias[0]?.status).toBe("pending_transcription");
  });

  it("should filter medias by tags using OR semantics (at least one tag)", async () => {
    await inMemoryMediaRepository.create(
      makeMediaFactory({ userId: "user-123", tags: ["education", "tutorial"] }),
    );
    await inMemoryMediaRepository.create(makeMediaFactory({ userId: "user-123", tags: ["music"] }));
    await inMemoryMediaRepository.create(makeMediaFactory({ userId: "user-123", tags: [] }));

    const result = await sut.execute({
      userId: "user-123",
      perPage: 10,
      page: 1,
      tags: ["education", "music"],
    });

    expect(result.isRight()).toBe(true);
    expect(result.value?.meta.total).toBe(2);
  });

  it("should return an empty page when the page exceeds the total pages", async () => {
    await inMemoryMediaRepository.create(makeMediaFactory({ userId: "user-123" }));

    const result = await sut.execute({
      userId: "user-123",
      perPage: 10,
      page: 5,
    });

    expect(result.isRight()).toBe(true);
    expect(result.value?.medias).toEqual([]);
    expect(result.value?.meta).toEqual({
      page: 5,
      perPage: 10,
      total: 1,
      totalPages: 1,
    });
  });

  it("should be able to fetch medias paginated", async () => {
    for (let index = 0; index < 21; index += 1) {
      await inMemoryMediaRepository.create(makeMediaFactory({ userId: "user-123" }));
    }

    const result = await sut.execute({
      userId: "user-123",
      perPage: 10,
      page: 1,
    });

    expect(result.isRight()).toBe(true);
    expect(result.value?.medias.length).toBe(10);
    expect(result.value?.meta.total).toBe(21);
    expect(result.value?.meta.page).toBe(1);
    expect(result.value?.meta.perPage).toBe(10);
    expect(result.value?.meta.totalPages).toBe(3);
  });

  it("should be able to fetch the last page of medias", async () => {
    for (let index = 0; index < 21; index += 1) {
      await inMemoryMediaRepository.create(makeMediaFactory({ userId: "user-123" }));
    }

    const result = await sut.execute({
      userId: "user-123",
      perPage: 10,
      page: 3,
    });

    expect(result.isRight()).toBe(true);
    expect(result.value?.medias.length).toBe(1);
    expect(result.value?.meta.total).toBe(21);
    expect(result.value?.meta.page).toBe(3);
    expect(result.value?.meta.perPage).toBe(10);
    expect(result.value?.meta.totalPages).toBe(3);
  });

  it("should round totalPages up when the total is not a multiple of perPage", async () => {
    for (let index = 0; index < 25; index += 1) {
      await inMemoryMediaRepository.create(makeMediaFactory({ userId: "user-123" }));
    }

    const result = await sut.execute({
      userId: "user-123",
      perPage: 10,
      page: 1,
    });

    expect(result.isRight()).toBe(true);
    expect(result.value?.meta.totalPages).toBe(3);
  });
});
