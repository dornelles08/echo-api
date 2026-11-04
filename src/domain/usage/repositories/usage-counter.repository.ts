import type { UsageCounter } from "../entities/UsageCounter";

export interface UsageCounterRepository {
  getOrCreate(userId: string): Promise<UsageCounter>;
  increment(id: string, minutes: number): Promise<void>;
  findByUserId(userId: string): Promise<UsageCounter | null>;
}
