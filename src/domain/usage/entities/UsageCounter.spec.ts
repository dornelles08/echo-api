import { describe, expect, it } from "vitest";

import { UsageCounter } from "./UsageCounter";

describe("UsageCounter entity", () => {
  const cycle = {
    cycleStart: new Date("2026-01-01T00:00:00Z"),
    cycleEnd: new Date("2026-01-31T23:59:59Z"),
  };

  it("defaults minutesUsed to zero on create", () => {
    const counter = UsageCounter.create({
      userId: "user-1",
      ...cycle,
      minutesUsed: undefined as unknown as number,
    });

    expect(counter.minutesUsed).toBe(0);
  });

  it("addMinutes accumulates usage and refreshes updatedAt", () => {
    const counter = UsageCounter.create({
      userId: "user-1",
      ...cycle,
      minutesUsed: 5,
      updatedAt: new Date("2020-01-01T00:00:00Z"),
    });

    counter.addMinutes(3);

    expect(counter.minutesUsed).toBe(8);
    expect(counter.updatedAt?.getTime()).toBeGreaterThan(
      new Date("2020-01-01T00:00:00Z").getTime(),
    );
  });

  it("isExpired is true only when cycleEnd is in the past", () => {
    const past = UsageCounter.create({
      userId: "user-1",
      cycleStart: new Date("2000-01-01T00:00:00Z"),
      cycleEnd: new Date("2000-01-31T23:59:59Z"),
      minutesUsed: 0,
    });
    const future = UsageCounter.create({
      userId: "user-1",
      cycleStart: new Date("2000-01-01T00:00:00Z"),
      cycleEnd: new Date("2999-01-31T23:59:59Z"),
      minutesUsed: 0,
    });

    expect(past.isExpired()).toBe(true);
    expect(future.isExpired()).toBe(false);
  });

  it("getCurrentCycleDates spans the whole current month", () => {
    const { cycleStart, cycleEnd } = UsageCounter.getCurrentCycleDates();
    const now = new Date();

    expect(cycleStart.getFullYear()).toBe(now.getFullYear());
    expect(cycleStart.getMonth()).toBe(now.getMonth());
    expect(cycleStart.getDate()).toBe(1);
    expect(cycleStart.getHours()).toBe(0);
    expect(cycleEnd.getMonth()).toBe(now.getMonth());
    expect(cycleEnd.getDate()).toBe(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate());
    expect(cycleEnd.getTime()).toBeGreaterThan(cycleStart.getTime());
  });
});
