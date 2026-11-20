import type { Plan } from "../entities";

export interface PlanFilters {
  isActive?: boolean;
  name?: string;
  code?: string;
}

export interface PlanRepository {
  findAll(filter?: PlanFilters): Promise<Plan[]>;
  findById(id: string): Promise<Plan | null>;
  findByName(name: string): Promise<Plan | null>;
  findByCode(code: string): Promise<Plan | null>;
  create(plan: Plan): Promise<void>;
}
