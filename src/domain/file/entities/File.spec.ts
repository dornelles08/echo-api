import { describe, expect, it } from "vitest";

import { File } from "./File";

describe("File entity", () => {
  it("creates a file with name, url and key", () => {
    const file = File.create({ name: "a.mp3", url: "memory:///a.mp3", key: "key-1" });

    expect(file.name).toBe("a.mp3");
    expect(file.url).toBe("memory:///a.mp3");
    expect(file.key).toBe("key-1");
    expect(file.id).toBeTruthy();
  });

  it("keeps a provided id", () => {
    const file = File.create({ name: "a.mp3", url: "u", key: "k" }, "file-1");

    expect(file.id).toBe("file-1");
  });
});
