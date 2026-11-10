import type { UsageCounterRepository } from "../../usage";
import { UsageCounter } from "../../usage";

export class InMemoryUsageCounterRepository implements UsageCounterRepository {
  private counters: Map<string, UsageCounter> = new Map();

  async getOrCreate(userId: string): Promise<UsageCounter> {
    let counter = this.counters.get(userId);

    if (!counter || counter.isExpired()) {
      counter = UsageCounter.create({
        userId,
        ...UsageCounter.getCurrentCycleDates(),
        minutesUsed: 0,
      });
      this.counters.set(userId, counter);
    }

    return counter;
  }

  async increment(id: string, minutes: number): Promise<void> {
    for (const counter of this.counters.values()) {
      if (counter.id === id) {
        counter.addMinutes(minutes);
        return;
      }
    }
  }

  async reserveMinutes(userId: string, minutes: number): Promise<boolean> {
    const counter = await this.getOrCreate(userId);
    counter.addMinutes(minutes);
    return true;
  }

  async findByUserId(userId: string): Promise<UsageCounter | null> {
    const counter = this.counters.get(userId);
    if (!counter) return null;
    if (counter.isExpired()) return null;
    return counter;
  }

  async decrement(userId: string, minutes: number): Promise<void> {
    const counter = this.counters.get(userId);
    if (counter) {
      counter.subtractMinutes(minutes);
    }
  }
}
