import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { env } from "../env";
import { LocalStorageService } from "./local-storage.service";

describe("LocalStorageService", () => {
  let uploadDir: string;
  const originalUploadDir = env.UPLOAD_DIR;

  beforeAll(async () => {
    uploadDir = await mkdtemp(join(tmpdir(), "echo-local-storage-"));
    env.UPLOAD_DIR = uploadDir;
  });

  afterAll(async () => {
    env.UPLOAD_DIR = originalUploadDir;
    await rm(uploadDir, { recursive: true, force: true });
  });

  it("saveFile persists the content under a unique key and returns url and key", async () => {
    const storage = new LocalStorageService();

    const stored = await storage.saveFile(Buffer.from("hello"), "audio.mp3");

    expect(stored.key).toMatch(/.+audio\.mp3$/);
    expect(stored.url).toBe(join(uploadDir, stored.key));

    const content = await storage.readFile(stored.key);
    expect(content).toEqual(Buffer.from("hello"));
  });

  it("saveFile generates unique keys for the same filename", async () => {
    const storage = new LocalStorageService();

    const a = await storage.saveFile(Buffer.from("a"), "same.mp3");
    const b = await storage.saveFile(Buffer.from("b"), "same.mp3");

    expect(a.key).not.toBe(b.key);
  });

  it("deleteFile removes the object and ignores missing files", async () => {
    const storage = new LocalStorageService();

    const stored = await storage.saveFile(Buffer.from("bye"), "bye.mp3");
    await storage.deleteFile(stored.key);

    await expect(storage.readFile(stored.key)).rejects.toThrow();

    // Deleting a missing key must not throw.
    await expect(storage.deleteFile(stored.key)).resolves.toBeUndefined();
  });

  it("readFile fails for an unknown key", async () => {
    const storage = new LocalStorageService();

    await expect(storage.readFile("does-not-exist.mp3")).rejects.toThrow();
  });
});
