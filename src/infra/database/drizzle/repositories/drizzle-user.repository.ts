import { eq } from "drizzle-orm";

import { UsageCounter } from "../../../../domain/usage";
import { User } from "../../../../domain/user/entities/User";
import { UserWithPlan } from "../../../../domain/user/entities/value-objects/UserWithPlan";
import type { UserRepository } from "../../../../domain/user/repositories/user.repository";
import { db } from "..";
import { PlanMapper } from "../mappers/plan.mapper";
import { UserMapper } from "../mappers/user.mapper";
import { plans, users } from "../schema";

export class DrizzleUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    return row ? UserMapper.toDomain(row) : null;
  }

  async findById(id: string): Promise<User | null> {
    const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);

    return row ? UserMapper.toDomain(row) : null;
  }

  async findDetailsById(id: string): Promise<UserWithPlan | null> {
    const [row] = await db
      .select({ user: users, plan: plans })
      .from(users)
      .innerJoin(plans, eq(users.planId, plans.id))
      .where(eq(users.id, id))
      .limit(1);

    if (!row) {
      return null;
    }

    const { cycleEnd } = UsageCounter.getCurrentCycleDates();

    return new UserWithPlan({
      id: row.user.id,
      name: row.user.name,
      email: row.user.email,
      plan: PlanMapper.toDomain(row.plan),
      cycleEnd,
      createdAt: row.user.createdAt,
      updatedAt: row.user.updatedAt,
    });
  }

  async create(user: User): Promise<void> {
    await db.insert(users).values(UserMapper.toPersistence(user));
  }
}
