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

  /**
   * Reserva minutos de forma atômica dentro de uma transação. Bloqueia a linha
   * do counter (`FOR UPDATE`), verifica se o ciclo está vigente e incrementa o
   * uso. Retorna `true` se a reserva foi aplicada, `false` se não foi possível
   * (ex.: linha não encontrada). O limite do plano é validado pelo chamador.
   */
  async reserveMinutes(userId: string, minutes: number): Promise<boolean> {
    const { cycleStart, cycleEnd } = UsageCounter.getCurrentCycleDates();

    return await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(usageCounters)
        .where(eq(usageCounters.userId, userId))
        .for("update")
        .limit(1);

      let row = existing;

      if (!row || new Date() > row.cycleEnd) {
        const [upserted] = await tx
          .insert(usageCounters)
          .values({ userId, cycleStart, cycleEnd, minutesUsed: 0 })
          .onConflictDoUpdate({
            target: usageCounters.userId,
            set: { cycleStart, cycleEnd, minutesUsed: 0, updatedAt: new Date() },
          })
          .returning();

        if (!upserted) {
          return false;
        }
        row = upserted;
      }

      const minutesUsed = Number(row.minutesUsed ?? 0);
      const [updated] = await tx
        .update(usageCounters)
        .set({ minutesUsed: minutesUsed + minutes, updatedAt: new Date() })
        .where(eq(usageCounters.id, row.id))
        .returning();

      return Boolean(updated);
    });
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

  async decrement(userId: string, minutes: number): Promise<void> {
    await db
      .update(usageCounters)
      .set({
        minutesUsed: sql`GREATEST(${usageCounters.minutesUsed} - ${minutes}, 0)`,
        updatedAt: new Date(),
      })
      .where(eq(usageCounters.userId, userId));
  }
}
