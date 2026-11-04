import { and, eq } from "drizzle-orm";

import type {
  Plan,
  PlanFilters,
  PlanRepository,
} from "../../../../domain/plan";
import { db } from "..";
import { PlanMapper } from "../mappers/plan.mapper";
import { plans } from "../schema";

export class DrizzlePlanRepository implements PlanRepository {
  async findAll(filter?: PlanFilters): Promise<Plan[]> {
    const conditions = [];

    if (filter?.isActive !== undefined) {
      conditions.push(eq(plans.isActive, filter.isActive));
    }

    if (filter?.name) {
      conditions.push(eq(plans.name, filter.name));
    }

    const rows = await db
      .select()
      .from(plans)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(plans.monthlyMinutesLimit);

    return rows.map(PlanMapper.toDomain);
  }

  async findById(id: string): Promise<Plan | null> {
    const [row] = await db.select().from(plans).where(eq(plans.id, id)).limit(1);

    return row ? PlanMapper.toDomain(row) : null;
  }

  async findByName(name: string): Promise<Plan | null> {
    const [row] = await db.select().from(plans).where(eq(plans.name, name)).limit(1);

    return row ? PlanMapper.toDomain(row) : null;
  }

  async create(plan: Plan): Promise<void> {
    await db.insert(plans).values(PlanMapper.toPersistence(plan));
  }
}
