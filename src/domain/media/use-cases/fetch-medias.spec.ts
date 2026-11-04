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

  it("should be able to fetch a media type video", async () => {
    Array.from({ length: 5 }).forEach(async () => {
      const media = makeMediaFactory({
        userId: "user-123",
      });
      await inMemoryMediaRepository.create(media);
    });

    const totalMediasVideo = inMemoryMediaRepository.items.filter((i) => i.type === "video").length;

    const result = await sut.execute({
      userId: "user-123",
      perPage: 10,
      page: 1,
      type: "video",
    });

    expect(result.isRight()).toBe(true);
    expect(result.value?.medias.length).toBe(totalMediasVideo);
    expect(result.value?.meta.total).toBe(totalMediasVideo);
    expect(result.value?.meta.page).toBe(1);
    expect(result.value?.meta.perPage).toBe(10);
  });

  it("should be able to fetch a media in portuguese", async () => {
    Array.from({ length: 9 }).forEach(async () => {
      const media = makeMediaFactory({
        userId: "user-123",
      });
      await inMemoryMediaRepository.create(media);
    });

    const totalMediasPortugues = inMemoryMediaRepository.items.filter(
      (i) => i.language === "pt-BR" && i.type === "video",
    ).length;

    const result = await sut.execute({
      userId: "user-123",
      perPage: 10,
      page: 1,
      type: "video",
      language: "pt-BR",
    });

    expect(result.isRight()).toBe(true);
    expect(result.value?.medias.length).toBe(totalMediasPortugues);
    expect(result.value?.meta.total).toBe(totalMediasPortugues);
    expect(result.value?.meta.page).toBe(1);
    expect(result.value?.meta.perPage).toBe(10);
  });

  it("should be able to fetch a media type audio", async () => {
    Array.from({ length: 5 }).forEach(async () => {
      const media = makeMediaFactory({
        userId: "user-123",
      });
      await inMemoryMediaRepository.create(media);
    });

    const totalMediasAudio = inMemoryMediaRepository.items.filter((i) => i.type === "audio").length;

    const result = await sut.execute({
      userId: "user-123",
      perPage: 10,
      page: 1,
      type: "audio",
    });

    expect(result.isRight()).toBe(true);
    expect(result.value?.medias.length).toBe(totalMediasAudio);
    expect(result.value?.meta.total).toBe(totalMediasAudio);
    expect(result.value?.meta.page).toBe(1);
    expect(result.value?.meta.perPage).toBe(10);
  });

  it("should be able to fetch a media paginated", async () => {
    Array.from({ length: 21 }).forEach(async () => {
      const media = makeMediaFactory({
        userId: "user-123",
      });
      await inMemoryMediaRepository.create(media);
    });

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

  it("should be able to fetch a media paginated with more than 10 items", async () => {
    Array.from({ length: 21 }).forEach(async () => {
      const media = makeMediaFactory({
        userId: "user-123",
      });
      await inMemoryMediaRepository.create(media);
    });

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

  it("should be able to fetch a media by status", async () => {
    Array.from({ length: 21 }).forEach(async () => {
      const media = makeMediaFactory({
        userId: "user-123",
      });
      await inMemoryMediaRepository.create(media);
    });

    const result = await sut.execute({
      userId: "user-123",
      perPage: 10,
      page: 1,
      status: "pending_transcription",
    });
    const totalMediasPending = inMemoryMediaRepository.items.filter(
      (i) => i.status === "pending_transcription",
    ).length;

    expect(result.isRight()).toBe(true);
    expect(result.value?.meta.total).toBe(totalMediasPending);
    expect(result.value?.meta.page).toBe(1);
    expect(result.value?.meta.perPage).toBe(10);
  });
});
