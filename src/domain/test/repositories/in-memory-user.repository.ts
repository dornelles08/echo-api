import type { User } from "../../user/entities/User";
import { UserWithPlan } from "../../user/entities/value-objects/UserWithPlan";
import type { UserRepository } from "../../user/repositories/user.repository";
import type { InMemoryPlanRepository } from "./in-memory-plan.repository";

export class InMemoryUserRepository implements UserRepository {
  public items: User[] = [];
  plans = [
    {
      id: "free",
      name: "Free",
      description: "Ideal para testar",
      monthlyMinutesLimit: 30,
      allowVideoUpload: false,
      audioRetentionDays: 7,
      videoRetentionDays: 0,
      maxSummaryAttemptsPerMedia: 1,
    },
    {
      id: "starter",
      name: "Starter",
      description: "Para criadores e profissionais",
      monthlyMinutesLimit: 360,
      allowVideoUpload: false,
      audioRetentionDays: 30,
      videoRetentionDays: 0,
      maxSummaryAttemptsPerMedia: 1,
    },
    {
      id: "pro",
      name: "Pro",
      description: "Para quem trabalha com conteúdo",
      monthlyMinutesLimit: 1200,
      allowVideoUpload: true,
      audioRetentionDays: 60,
      videoRetentionDays: 15,
      maxSummaryAttemptsPerMedia: 3,
    },
    {
      id: "business",
      name: "Business",
      description: "Para times e empresas",
      monthlyMinutesLimit: 3000,
      allowVideoUpload: true,
      audioRetentionDays: 180,
      videoRetentionDays: 90,
      maxSummaryAttemptsPerMedia: 5,
    },
  ];

  constructor(private readonly inMemoryPlanRepository: InMemoryPlanRepository) {}

  async findByEmail(email: string): Promise<User | null> {
    const user = this.items.find((user) => user.email === email);
    return user ?? null;
  }

  async findById(id: string): Promise<User | null> {
    const user = this.items.find((user) => user.id === id);
    return user ?? null;
  }

  async findDetailsById(id: string): Promise<UserWithPlan | null> {
    const user = this.items.find((user) => user.id === id);

    if (!user) return null;

    const plan = await this.inMemoryPlanRepository.findById(user.planId);
    if (!plan) return null;

    const userWithPlan = new UserWithPlan({
      id: user?.id ?? "",
      email: user?.email ?? "",
      name: user?.name ?? "",
      plan,
      createdAt: user?.createdAt ?? new Date(),
      updatedAt: user?.updatedAt ?? new Date(),
      cycleEnd: new Date(),
    });

    return userWithPlan ?? null;
  }

  async create(user: User): Promise<void> {
    this.items.push(user);
  }
}
