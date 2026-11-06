import { describe, expect, it } from "vitest";

import { registerAndLogin } from "./helpers/auth";
import { makeWavBuffer, multipartFilePayload } from "./helpers/multipart";
import { type TestApp, useTestApp } from "./helpers/test-app";
import { e2eSql, setMinutesUsed } from "./helpers/test-db";

async function uploadFile(
  app: TestApp,
  token: string,
  { filename, contentType, data }: { filename: string; contentType: string; data: Buffer },
) {
  const { payload, headers } = multipartFilePayload({ filename, contentType, data });

  return app.inject({
    method: "POST",
    url: "/files/upload",
    headers: { authorization: `Bearer ${token}`, ...headers },
    payload,
  });
}

async function getUserId(app: TestApp, token: string): Promise<string> {
  const response = await app.inject({
    method: "GET",
    url: "/me",
    headers: { authorization: `Bearer ${token}` },
  });

  const { user } = response.json() as { user: { id: string } };
  return user.id;
}

describe("POST /files/upload", () => {
  const app = useTestApp();

  it("returns 401 without a token", async () => {
    const { payload, headers } = multipartFilePayload({
      filename: "audio.wav",
      contentType: "audio/wav",
      data: makeWavBuffer(1),
    });

    const response = await app.inject({
      method: "POST",
      url: "/files/upload",
      headers,
      payload,
    });

    expect(response.statusCode).toBe(401);
  });

  it("uploads a wav file and returns url, key, filename and duration", async () => {
    const user = await registerAndLogin(app);

    const response = await uploadFile(app, user.token, {
      filename: "sample.wav",
      contentType: "audio/wav",
      data: makeWavBuffer(1),
    });

    expect(response.statusCode).toBe(201);

    const body = response.json() as {
      url: string;
      key: string;
      filename: string;
      duration: number;
    };

    expect(body.filename).toBe("sample.wav");
    expect(body.key).toBeTruthy();
    expect(body.url).toBeTruthy();
    expect(body.duration).toBeCloseTo(1, 0);
  });

  it("returns 400 when no file is sent", async () => {
    const user = await registerAndLogin(app);

    const response = await app.inject({
      method: "POST",
      url: "/files/upload",
      headers: {
        authorization: `Bearer ${user.token}`,
        "content-type": "multipart/form-data; boundary=----echo-e2e-boundary",
      },
      payload: "------echo-e2e-boundary--\r\n",
    });

    expect(response.statusCode).toBe(400);
  });

  it("rejects video uploads for the Free plan with 403", async () => {
    const user = await registerAndLogin(app);

    const response = await uploadFile(app, user.token, {
      filename: "video.mp4",
      contentType: "video/mp4",
      data: Buffer.from("not a real video but the extension is what matters"),
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({ error: expect.any(String) });
  });

  it("allows video uploads once the user's plan allows videos", async () => {
    const user = await registerAndLogin(app);
    const userId = await getUserId(app, user.token);

    await e2eSql()`UPDATE users SET plan_id = (SELECT id FROM plans WHERE name = 'Pro') WHERE id = ${userId}`;

    const response = await uploadFile(app, user.token, {
      filename: "video.mp4",
      contentType: "video/mp4",
      // Not a valid mp4: ffprobe fails, duration is treated as 0 (0 minutes),
      // which is allowed by the quota check.
      data: Buffer.from("fake video content"),
    });

    expect(response.statusCode).toBe(201);
  });

  it("returns 402 when the monthly minutes quota is exhausted", async () => {
    const user = await registerAndLogin(app);
    const userId = await getUserId(app, user.token);

    // Free plan: 30 minutes per cycle. Use them all.
    await setMinutesUsed(userId, 30);

    const response = await uploadFile(app, user.token, {
      filename: "audio.wav",
      contentType: "audio/wav",
      data: makeWavBuffer(1),
    });

    expect(response.statusCode).toBe(402);
    expect(response.json()).toEqual({ error: expect.any(String) });
  });

  it("accepts a file with unreadable content as duration 0", async () => {
    const user = await registerAndLogin(app);

    const response = await uploadFile(app, user.token, {
      filename: "garbage.mp3",
      contentType: "audio/mpeg",
      data: Buffer.from("this is definitely not an mp3"),
    });

    expect(response.statusCode).toBe(201);

    const body = response.json() as { duration: number };
    expect(body.duration).toBe(0);
  });
});
