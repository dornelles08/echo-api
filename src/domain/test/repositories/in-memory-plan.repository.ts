import type { Plan, PlanFilters, PlanRepository } from "../../index";

export class InMemoryPlanRepository implements PlanRepository {
  public items: Plan[] = [];

  async findAll(filter?: PlanFilters): Promise<Plan[]> {
    let result = this.items;

    if (filter?.isActive !== undefined) {
      result = result.filter((plan) => plan.isActive === filter.isActive);
    }

    if (filter?.name) {
      result = result.filter((plan) => plan.name === filter.name);
    }

    return [...result].sort((a, b) => a.monthlyMinutesLimit - b.monthlyMinutesLimit);
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
