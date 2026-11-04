import { UsageCounter } from "../../../../domain/usage/entities/UsageCounter";
import type { UsageCounterRow } from "../schema";

export namespace UsageCounterMapper {
  export function toDomain(row: UsageCounterRow): UsageCounter {
    return UsageCounter.create(
      {
        userId: row.userId,
        cycleStart: row.cycleStart,
        cycleEnd: row.cycleEnd,
        minutesUsed: row.minutesUsed,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }

  export function toPersistence(usageCounter: UsageCounter) {
    return {
      userId: usageCounter.userId,
      cycleStart: usageCounter.cycleStart,
      cycleEnd: usageCounter.cycleEnd,
      minutesUsed: usageCounter.minutesUsed,
      createdAt: usageCounter.createdAt,
      updatedAt: usageCounter.updatedAt,
    };
  }
}
