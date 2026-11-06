import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const REQUIRED_ENV: Record<string, string> = {
  DATABASE_URL: "postgres://echo:echo@localhost:5432/echo",
  JWT_SECRET: "test-secret",
};

describe("refreshCookieOptions", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    Object.assign(process.env, REQUIRED_ENV);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("uses lax, insecure cookies outside production", async () => {
    process.env.NODE_ENV = "test";
    const { refreshCookieOptions } = await import("./cookies");

    expect(refreshCookieOptions()).toMatchObject({
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });
  });

  it("uses none + secure in production", async () => {
    process.env.NODE_ENV = "production";
    const { refreshCookieOptions } = await import("./cookies");

    expect(refreshCookieOptions()).toMatchObject({
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
  });
});
