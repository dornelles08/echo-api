import { describe, expect, it } from "vitest";

import { isCorsOriginAllowed, parseCorsOrigins } from "./cors";

describe("parseCorsOrigins", () => {
  it("splits, trims and removes empty entries", () => {
    expect(parseCorsOrigins(" http://localhost:3000 , http://localhost:3001, ")).toEqual([
      "http://localhost:3000",
      "http://localhost:3001",
    ]);
  });
});

describe("isCorsOriginAllowed", () => {
  const patterns = parseCorsOrigins("http://localhost:*,http://192.168.0.14:*");

  it("allows requests without an Origin header", () => {
    expect(isCorsOriginAllowed(undefined, patterns)).toBe(true);
  });

  it("allows any port for a wildcard host", () => {
    expect(isCorsOriginAllowed("http://localhost:3000", patterns)).toBe(true);
    expect(isCorsOriginAllowed("http://localhost:5173", patterns)).toBe(true);
    expect(isCorsOriginAllowed("http://192.168.0.14:3001", patterns)).toBe(true);
  });

  it("matches exact origins", () => {
    expect(isCorsOriginAllowed("http://localhost:3000", ["http://localhost:3000"])).toBe(true);
  });

  it("blocks unknown hosts, schemes and ports when not wildcarded", () => {
    expect(isCorsOriginAllowed("http://192.168.0.15:3001", patterns)).toBe(false);
    expect(isCorsOriginAllowed("https://localhost:3001", patterns)).toBe(false);
    expect(isCorsOriginAllowed("http://localhost:3001", ["http://localhost:3000"])).toBe(false);
  });

  it("does not treat dots in the pattern as regex wildcards", () => {
    expect(isCorsOriginAllowed("http://localhostX3001", ["http://localhost:3001"])).toBe(false);
  });

  it("allows every origin when the pattern is `*`", () => {
    expect(isCorsOriginAllowed("http://example.com:8080", ["*"])).toBe(true);
  });
});
