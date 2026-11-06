import { describe, expect, it } from "vitest";

import { registerAndLogin } from "./helpers/auth";
import { useTestApp } from "./helpers/test-app";
import { e2eSql } from "./helpers/test-db";

describe("GET /plans", () => {
  const app = useTestApp();

  it("lists the seeded plans ordered by monthly minutes limit", async () => {
    const response = await app.inject({ method: "GET", url: "/plans" });

    expect(response.statusCode).toBe(200);

    const { plans } = response.json() as { plans: Array<Record<string, unknown>> };

    expect(plans.map((plan) => plan.name)).toEqual(["Free", "Starter", "Pro", "Business"]);
    expect(plans[0]).toMatchObject({
      name: "Free",
      price: 0,
      monthlyMinutesLimit: 30,
      allowVideoUpload: false,
      maxSummaryAttemptsPerMedia: 1,
    });
  });

  it("filters plans by name", async () => {
    const response = await app.inject({ method: "GET", url: "/plans?name=Pro" });

    expect(response.statusCode).toBe(200);

    const { plans } = response.json() as { plans: Array<{ name: string }> };
    expect(plans.map((plan) => plan.name)).toEqual(["Pro"]);
  });

  it("returns an empty list when the name matches nothing", async () => {
    const response = await app.inject({ method: "GET", url: "/plans?name=Nope" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ plans: [] });
  });

  it("filters plans by isActive=true", async () => {
    await e2eSql()`UPDATE plans SET is_active = false WHERE name = 'Pro'`;

    const response = await app.inject({ method: "GET", url: "/plans?isActive=true" });

    const { plans } = response.json() as { plans: Array<{ name: string }> };
    expect(plans.map((plan) => plan.name)).toEqual(["Free", "Starter", "Business"]);
  });

  it("filters plans by isActive=false", async () => {
    await e2eSql()`UPDATE plans SET is_active = false WHERE name = 'Pro'`;

    const response = await app.inject({ method: "GET", url: "/plans?isActive=false" });

    const { plans } = response.json() as { plans: Array<{ name: string }> };
    expect(plans.map((plan) => plan.name)).toEqual(["Pro"]);
  });

  it("returns 400 for an invalid isActive value", async () => {
    const response = await app.inject({ method: "GET", url: "/plans?isActive=yes" });

    expect(response.statusCode).toBe(400);
  });
});

describe("GET /summary-templates", () => {
  const app = useTestApp();

  it("returns 401 without a token", async () => {
    const response = await app.inject({ method: "GET", url: "/summary-templates" });

    expect(response.statusCode).toBe(401);
  });

  it("returns the seeded templates for an authenticated user", async () => {
    const user = await registerAndLogin(app);

    const response = await app.inject({
      method: "GET",
      url: "/summary-templates",
      headers: { authorization: `Bearer ${user.token}` },
    });

    expect(response.statusCode).toBe(200);

    const { templates } = response.json() as {
      templates: Array<Record<string, unknown>>;
    };

    expect(templates.length).toBeGreaterThanOrEqual(3);

    for (const template of templates) {
      expect(template).toMatchObject({
        id: expect.any(String),
        label: expect.any(String),
        description: expect.any(String),
        prompt: expect.any(String),
      });
    }
  });
});
