import type { Plan, PlanRepository } from "../../index";

export class InMemoryPlanRepository implements PlanRepository {
  public items: Plan[] = [];

  async findAll(): Promise<Plan[]> {
    return this.items;
  }

  async findById(id: string): Promise<Plan | null> {
    return this.items.find((plan) => plan.id === id) || null;
  }

  async findByName(name: string): Promise<Plan | null> {
    return this.items.find((plan) => plan.name === name) || null;
  }

  async create(plan: Plan): Promise<void> {
    this.items.push(plan);
  }
}
