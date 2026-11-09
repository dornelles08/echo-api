import { describe, expect, it } from "vitest";

import { registerAndLogin } from "./helpers/auth";
import { useTestApp } from "./helpers/test-app";

describe("POST /api/auth/sign-up/email", () => {
  const app = useTestApp();

  it("creates a user and returns a session token", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/sign-up/email",
      headers: { origin: "http://localhost:3000" },
      payload: { name: "John Doe", email: "john@example.com", password: "secret123" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      user: { email: "john@example.com", name: "John Doe" },
      token: expect.any(String),
    });
  });

  it("returns an error when the email is already registered", async () => {
    await registerAndLogin(app, { email: "dup@example.com" });

    const response = await app.inject({
      method: "POST",
      url: "/api/auth/sign-up/email",
      headers: { origin: "http://localhost:3000" },
      payload: { name: "John Again", email: "dup@example.com", password: "secret123" },
    });

    expect(response.statusCode).toBeGreaterThanOrEqual(400);
  });
});

describe("POST /api/auth/sign-in/email", () => {
  const app = useTestApp();

  it("returns 200 and a session token for valid credentials", async () => {
    await registerAndLogin(app, { email: "login@example.com", password: "secret123" });

    const response = await app.inject({
      method: "POST",
      url: "/api/auth/sign-in/email",
      headers: { origin: "http://localhost:3000" },
      payload: { email: "login@example.com", password: "secret123" },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ token: expect.any(String) });
  });

  it("returns an error for a wrong password", async () => {
    await registerAndLogin(app, { email: "login2@example.com", password: "secret123" });

    const response = await app.inject({
      method: "POST",
      url: "/api/auth/sign-in/email",
      headers: { origin: "http://localhost:3000" },
      payload: { email: "login2@example.com", password: "wrong-password" },
    });

    expect(response.statusCode).toBeGreaterThanOrEqual(400);
  });

  it("returns an error for an unknown email", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/sign-in/email",
      headers: { origin: "http://localhost:3000" },
      payload: { email: "ghost@example.com", password: "secret123" },
    });

    expect(response.statusCode).toBeGreaterThanOrEqual(400);
  });
});

describe("GET /me", () => {
  const app = useTestApp();

  it("returns the profile for an authenticated user", async () => {
    const user = await registerAndLogin(app);

    const response = await app.inject({
      method: "GET",
      url: "/me",
      headers: { authorization: `Bearer ${user.token}` },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ user: { email: user.email } });
  });

  it("returns 401 without a token", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/me",
    });

    expect(response.statusCode).toBe(401);
  });
});
