import { describe, expect, it } from "vitest";

import { loginSchema, registerSchema } from "./auth/schemas";
import {
  createMediaSchema,
  fetchMediasQuerySchema,
  getMediaParamsSchema,
  summaryMediaBodySchema,
  summaryMediaParamsSchema,
} from "./media/schemas";
import { fetchPlansQuerySchema } from "./plan/schemas";

describe("auth schemas", () => {
  it("loginSchema accepts a valid payload", () => {
    expect(loginSchema.parse({ email: "a@b.com", password: "senha1234" })).toEqual({
      email: "a@b.com",
      password: "senha1234",
    });
  });

  it("loginSchema rejects invalid email and short passwords", () => {
    expect(() => loginSchema.parse({ email: "nope", password: "senha1234" })).toThrow();
    expect(() => loginSchema.parse({ email: "a@b.com", password: "12345" })).toThrow();
    expect(() => loginSchema.parse({})).toThrow();
  });

  it("registerSchema accepts a valid payload", () => {
    expect(
      registerSchema.parse({ name: "John", email: "a@b.com", password: "senha1234" }).name,
    ).toBe("John");
  });

  it("registerSchema rejects empty name and invalid email", () => {
    expect(() =>
      registerSchema.parse({ name: "", email: "a@b.com", password: "senha1234" }),
    ).toThrow();
    expect(() =>
      registerSchema.parse({ name: "John", email: "nope", password: "senha1234" }),
    ).toThrow();
  });
});

describe("createMediaSchema", () => {
  const valid = {
    filename: "a.mp3",
    url: "memory:///a.mp3",
    type: "audio",
    language: "pt-BR",
    duration: 10,
  };

  it("accepts a valid payload and defaults type to audio", () => {
    const withoutType: Record<string, unknown> = { ...valid };
    delete withoutType.type;

    expect(createMediaSchema.parse(withoutType).type).toBe("audio");
  });

  it("rejects empty filename and url", () => {
    expect(() => createMediaSchema.parse({ ...valid, filename: "" })).toThrow();
    expect(() => createMediaSchema.parse({ ...valid, url: "" })).toThrow();
  });

  it("rejects negative duration and unknown media type", () => {
    expect(() => createMediaSchema.parse({ ...valid, duration: -1 })).toThrow();
    expect(() => createMediaSchema.parse({ ...valid, type: "image" })).toThrow();
  });

  it("accepts optional prompt, storageKey and tags", () => {
    const parsed = createMediaSchema.parse({
      ...valid,
      prompt: "p",
      storageKey: "k",
      tags: ["a", "b"],
    });

    expect(parsed.tags).toEqual(["a", "b"]);
    expect(parsed.storageKey).toBe("k");
  });
});

describe("fetchMediasQuerySchema", () => {
  it("applies defaults page=1 and perPage=20", () => {
    expect(fetchMediasQuerySchema.parse({})).toMatchObject({ page: 1, perPage: 20 });
  });

  it("coerces string numbers from query strings", () => {
    expect(fetchMediasQuerySchema.parse({ page: "2", perPage: "10" })).toMatchObject({
      page: 2,
      perPage: 10,
    });
  });

  it("rejects page < 1, perPage < 1 and perPage > 100", () => {
    expect(() => fetchMediasQuerySchema.parse({ page: "0" })).toThrow();
    expect(() => fetchMediasQuerySchema.parse({ perPage: "0" })).toThrow();
    expect(() => fetchMediasQuerySchema.parse({ perPage: "101" })).toThrow();
  });

  it("rejects non-integer page/perPage", () => {
    expect(() => fetchMediasQuerySchema.parse({ page: "1.5" })).toThrow();
  });

  it("parses comma separated tags into an array", () => {
    expect(fetchMediasQuerySchema.parse({ tags: "a,b,c" }).tags).toEqual(["a", "b", "c"]);
  });

  it("rejects unknown status and type values", () => {
    expect(() => fetchMediasQuerySchema.parse({ status: "nope" })).toThrow();
    expect(() => fetchMediasQuerySchema.parse({ type: "image" })).toThrow();
  });
});

describe("uuid params schemas", () => {
  const uuid = "123e4567-e89b-12d3-a456-426655440000";

  it("getMediaParamsSchema accepts a uuid and rejects garbage", () => {
    expect(getMediaParamsSchema.parse({ mediaId: uuid }).mediaId).toBe(uuid);
    expect(() => getMediaParamsSchema.parse({ mediaId: "not-a-uuid" })).toThrow();
  });

  it("summaryMediaParamsSchema accepts a uuid and rejects garbage", () => {
    expect(summaryMediaParamsSchema.parse({ mediaId: uuid }).mediaId).toBe(uuid);
    expect(() => summaryMediaParamsSchema.parse({ mediaId: "not-a-uuid" })).toThrow();
  });
});

describe("summaryMediaBodySchema", () => {
  it("accepts a minimal prompt", () => {
    expect(summaryMediaBodySchema.parse({ prompt: "resuma" })).toEqual({ prompt: "resuma" });
  });

  it("rejects empty prompts and oversized instructions", () => {
    expect(() => summaryMediaBodySchema.parse({ prompt: "" })).toThrow();
    expect(() =>
      summaryMediaBodySchema.parse({ prompt: "ok", instructions: "x".repeat(2001) }),
    ).toThrow();
  });
});

describe("fetchPlansQuerySchema", () => {
  it("parses isActive string enum", () => {
    expect(fetchPlansQuerySchema.parse({ isActive: "true" }).isActive).toBe(true);
    expect(fetchPlansQuerySchema.parse({ isActive: "false" }).isActive).toBe(false);
    expect(fetchPlansQuerySchema.parse({}).isActive).toBeUndefined();
  });

  it("rejects invalid isActive values", () => {
    expect(() => fetchPlansQuerySchema.parse({ isActive: "yes" })).toThrow();
  });
});
