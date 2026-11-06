import { beforeEach, describe, expect, it } from "vitest";

import { InMemoryExpiredStorageFilesRepository } from "../../test/repositories/in-memory-expired-storage-files.repository";
import { MemoryStorageService } from "../../test/services/memory-storage.service";
import { CleanupExpiredFilesUseCase } from "./cleanup-expired-files";

let expiredStorageFilesRepository: InMemoryExpiredStorageFilesRepository;
let memoryStorageService: MemoryStorageService;
let sut: CleanupExpiredFilesUseCase;

describe("Cleanup Expired Files", () => {
  beforeEach(() => {
    expiredStorageFilesRepository = new InMemoryExpiredStorageFilesRepository();
    memoryStorageService = new MemoryStorageService();
    sut = new CleanupExpiredFilesUseCase(expiredStorageFilesRepository, memoryStorageService);
  });

  it("should delete expired files and detach them from the media", async () => {
    expiredStorageFilesRepository.items = [
      { id: "media-1", storageKey: "key-audio-1" },
      { id: "media-2", storageKey: "key-video-1" },
    ];

    const result = await sut.execute();

    expect(result.isRight()).toBe(true);
    expect(result.value).toEqual({
      scanned: 2,
      deleted: 2,
      failed: 0,
      errors: [],
    });
    expect(expiredStorageFilesRepository.clearedIds).toEqual(["media-1", "media-2"]);
    expect(expiredStorageFilesRepository.items).toEqual([]);
  });

  it("should do nothing when there are no expired files", async () => {
    const result = await sut.execute();

    expect(result.isRight()).toBe(true);
    expect(result.value).toEqual({
      scanned: 0,
      deleted: 0,
      failed: 0,
      errors: [],
    });
  });

  it("should keep processing the batch when a file fails to be deleted", async () => {
    expiredStorageFilesRepository.items = [
      { id: "media-1", storageKey: "key-audio-1" },
      { id: "media-2", storageKey: "key-audio-2" },
    ];
    memoryStorageService.failingKeys.add("key-audio-1");

    const result = await sut.execute();

    expect(result.isRight()).toBe(true);
    expect(result.value).toEqual({
      scanned: 2,
      deleted: 1,
      failed: 1,
      errors: [{ id: "media-1", error: "Failed to delete file: key-audio-1" }],
    });
    expect(expiredStorageFilesRepository.clearedIds).toEqual(["media-2"]);
  });

  it("should clear the storage reference only after deleting the file", async () => {
    expiredStorageFilesRepository.items = [{ id: "media-1", storageKey: "key-audio-1" }];
    memoryStorageService.failingKeys.add("key-audio-1");

    await sut.execute();

    expect(expiredStorageFilesRepository.clearedIds).toEqual([]);
    expect(expiredStorageFilesRepository.items).toEqual([
      { id: "media-1", storageKey: "key-audio-1" },
    ]);
  });
});
