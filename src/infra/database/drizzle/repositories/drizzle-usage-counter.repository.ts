import { eq, sql } from "drizzle-orm";

import { UsageCounter, type UsageCounterRepository } from "../../../../domain/usage";
import { db } from "..";
import { UsageCounterMapper } from "../mappers/usage-counter.mapper";
import { usageCounters } from "../schema";

export class DrizzleUsageCounterRepository implements UsageCounterRepository {
  async getOrCreate(userId: string): Promise<UsageCounter> {
    const { cycleStart, cycleEnd } = UsageCounter.getCurrentCycleDates();

    const [existing] = await db
      .select()
      .from(usageCounters)
      .where(eq(usageCounters.userId, userId))
      .limit(1);

    if (existing && new Date() <= existing.cycleEnd) {
      return UsageCounterMapper.toDomain(existing);
    }

    const [row] = await db
      .insert(usageCounters)
      .values({ userId, cycleStart, cycleEnd, minutesUsed: 0 })
      .onConflictDoUpdate({
        target: usageCounters.userId,
        set: { cycleStart, cycleEnd, minutesUsed: 0, updatedAt: new Date() },
      })
      .returning();

    if (!row) {
      throw new Error(`Failed to create usage counter for user ${userId}`);
    }

    return UsageCounterMapper.toDomain(row);
  }

  async increment(id: string, minutes: number): Promise<void> {
    await db
      .update(usageCounters)
      .set({
        minutesUsed: sql`${usageCounters.minutesUsed} + ${minutes}`,
        updatedAt: new Date(),
      })
      .where(eq(usageCounters.id, id));
  }

  async findByUserId(userId: string): Promise<UsageCounter | null> {
    const [row] = await db
      .select()
      .from(usageCounters)
      .where(eq(usageCounters.userId, userId))
      .limit(1);

    if (!row || row.cycleEnd < new Date()) {
      return null;
    }

    return UsageCounterMapper.toDomain(row);
  }
}
