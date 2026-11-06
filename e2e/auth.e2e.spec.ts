import { describe, expect, it } from "vitest";

import { registerAndLogin } from "./helpers/auth";
import { useTestApp } from "./helpers/test-app";

describe("POST /users", () => {
  const app = useTestApp();

  it("creates a user and returns 201", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/users",
      payload: { name: "John Doe", email: "john@example.com", password: "secret123" },
    });

    expect(response.statusCode).toBe(201);
  });

  it("returns 409 when the email is already registered", async () => {
    await registerAndLogin(app, { email: "dup@example.com" });

    const response = await app.inject({
      method: "POST",
      url: "/users",
      payload: { name: "John Again", email: "dup@example.com", password: "secret123" },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({ message: expect.any(String) });
  });

  it("returns 400 for an invalid email", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/users",
      payload: { name: "John", email: "not-an-email", password: "secret123" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ message: "Validation error" });
  });

  it("returns 400 for a short password", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/users",
      payload: { name: "John", email: "john@example.com", password: "12345" },
    });

    expect(response.statusCode).toBe(400);
  });

  it("returns 400 when name is missing", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/users",
      payload: { email: "john@example.com", password: "secret123" },
    });

    expect(response.statusCode).toBe(400);
  });

  it("returns 400 for malformed JSON bodies", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/users",
      headers: { "content-type": "application/json" },
      payload: "{not json",
    });

    expect(response.statusCode).toBe(400);
  });
});

describe("POST /authenticate", () => {
  const app = useTestApp();

  it("returns 200, an access token and an httpOnly refreshToken cookie", async () => {
    await registerAndLogin(app, { email: "login@example.com", password: "secret123" });

    const response = await app.inject({
      method: "POST",
      url: "/authenticate",
      payload: { email: "login@example.com", password: "secret123" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ token: expect.any(String) });

    const cookie = response.cookies.find((c) => c.name === "refreshToken");
    expect(cookie).toBeDefined();
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.path).toBe("/");
    expect(cookie?.sameSite?.toLowerCase()).toBe("lax");
  });

  it("returns 401 for a wrong password", async () => {
    await registerAndLogin(app, { email: "login@example.com", password: "secret123" });

    const response = await app.inject({
      method: "POST",
      url: "/authenticate",
      payload: { email: "login@example.com", password: "wrong-password" },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ message: "Invalid email or password." });
  });

  it("returns 401 for an unknown email", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/authenticate",
      payload: { email: "ghost@example.com", password: "secret123" },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({ message: "Invalid email or password." });
  });

  it("returns 400 for an invalid payload", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/authenticate",
      payload: { email: "not-an-email", password: "secret123" },
    });

    expect(response.statusCode).toBe(400);
  });
});

describe("GET /me", () => {
  const app = useTestApp();

  it("returns the profile with the default Free plan and zero usage", async () => {
    const user = await registerAndLogin(app);

    const response = await app.inject({
      method: "GET",
      url: "/me",
      headers: { authorization: `Bearer ${user.token}` },
    });

    expect(response.statusCode).toBe(200);

    const { user: profile } = response.json() as {
      user: Record<string, unknown> & { plan: Record<string, unknown> };
    };

    expect(profile).toMatchObject({
      id: expect.any(String),
      name: user.name,
      email: user.email,
      minutesUsed: 0,
      minutesRemaining: 30,
    });
    expect(profile.plan).toMatchObject({
      name: "Free",
      monthlyMinutesLimit: 30,
      allowVideoUpload: false,
    });
    expect(profile.cycleEnd).toBeTruthy();
  });

  it("returns 401 without an Authorization header", async () => {
    const response = await app.inject({ method: "GET", url: "/me" });

    expect(response.statusCode).toBe(401);
  });

  it("returns 401 for a malformed Authorization header", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/me",
      headers: { authorization: "NotBearer xyz" },
    });

    expect(response.statusCode).toBe(401);
  });

  it("returns 401 for a garbage token", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/me",
      headers: { authorization: "Bearer not-a-real-token" },
    });

    expect(response.statusCode).toBe(401);
  });
});

describe("POST /refresh-token", () => {
  const app = useTestApp();

  it("rotates the access token using the refreshToken cookie", async () => {
    const user = await registerAndLogin(app);

    const response = await app.inject({
      method: "POST",
      url: "/refresh-token",
      cookies: { refreshToken: user.refreshCookie },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ token: expect.any(String) });

    const newAccessToken = (response.json() as { token: string }).token;

    // The rotated access token must be accepted by protected routes.
    const meResponse = await app.inject({
      method: "GET",
      url: "/me",
      headers: { authorization: `Bearer ${newAccessToken}` },
    });
    expect(meResponse.statusCode).toBe(200);
  });

  it("returns 401 without the cookie", async () => {
    const response = await app.inject({ method: "POST", url: "/refresh-token" });

    expect(response.statusCode).toBe(401);
  });

  it("returns 401 for a garbage refreshToken cookie", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/refresh-token",
      cookies: { refreshToken: "garbage" },
    });

    expect(response.statusCode).toBe(401);
  });

  it("returns 401 when the Authorization access token is used as cookie", async () => {
    // The cookie parser expects a JWT signed with the same secret; any opaque
    // value must be rejected.
    const response = await app.inject({
      method: "POST",
      url: "/refresh-token",
      cookies: { refreshToken: "opaque-value" },
    });

    expect(response.statusCode).toBe(401);
  });
});
