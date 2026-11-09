import { describe, expect, it } from "vitest";

import { useTestApp } from "./helpers/test-app";

describe("health & infrastructure", () => {
  const app = useTestApp();

  it("GET /health returns 200 with dependency status", async () => {
    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(["ok", "degraded"]).toContain(body.status);
    expect(body.dependencies).toBeDefined();
    expect(body.dependencies.database).toBeDefined();
  });

  it("returns 404 for unknown routes", async () => {
    const response = await app.inject({ method: "GET", url: "/definitely-not-a-route" });

    expect(response.statusCode).toBe(404);
  });

  it("reflects an allowed Origin in CORS headers", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/health",
      headers: { origin: "http://localhost:3000" },
    });

    expect(response.headers["access-control-allow-origin"]).toBe("http://localhost:3000");
    expect(response.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("does not reflect a disallowed Origin in CORS headers", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/health",
      headers: { origin: "http://evil.example.com" },
    });

    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("handles CORS preflight requests", async () => {
    const response = await app.inject({
      method: "OPTIONS",
      url: "/users",
      headers: {
        origin: "http://localhost:3000",
        "access-control-request-method": "POST",
        "access-control-request-headers": "content-type",
      },
    });

    expect(response.statusCode).toBeLessThan(300);
    expect(response.headers["access-control-allow-origin"]).toBe("http://localhost:3000");
  });
});
