import { describe, expect, it } from "vitest";

import { registerAndLogin } from "./helpers/auth";
import { useTestApp } from "./helpers/test-app";

describe("GET /tags", () => {
  const app = useTestApp();

  async function createMedia(token: string, tags: string[]) {
    const response = await app.inject({
      method: "POST",
      url: "/medias",
      headers: { authorization: `Bearer ${token}` },
      payload: {
        filename: "audio.mp3",
        url: "http://example.com/audio.mp3",
        type: "audio",
        language: "pt-BR",
        duration: 10,
        tags,
      },
    });

    expect(response.statusCode).toBe(201);
    return response;
  }

  it("returns 401 without a token", async () => {
    const response = await app.inject({ method: "GET", url: "/tags" });

    expect(response.statusCode).toBe(401);
  });

  it("returns an empty list when the user has no medias", async () => {
    const user = await registerAndLogin(app);

    const response = await app.inject({
      method: "GET",
      url: "/tags",
      headers: { authorization: `Bearer ${user.token}` },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ tags: [] });
  });

  it("returns sorted, deduplicated tags from the user's medias", async () => {
    const user = await registerAndLogin(app);

    await createMedia(user.token, ["zebra", "apple", "mango"]);
    await createMedia(user.token, ["mango", "apple", "other"]);
    await createMedia(user.token, []);

    const response = await app.inject({
      method: "GET",
      url: "/tags",
      headers: { authorization: `Bearer ${user.token}` },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ tags: ["apple", "mango", "other", "zebra"] });
  });

  it("does not leak tags from other users", async () => {
    const alice = await registerAndLogin(app);
    const bob = await registerAndLogin(app);

    await createMedia(alice.token, ["alice-tag"]);
    await createMedia(bob.token, ["bob-tag"]);

    const response = await app.inject({
      method: "GET",
      url: "/tags",
      headers: { authorization: `Bearer ${alice.token}` },
    });

    expect(response.json()).toEqual({ tags: ["alice-tag"] });
  });
});
