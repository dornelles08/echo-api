import type { User } from "../entities/User";
import type { UserWithPlan } from "../entities/value-objects/UserWithPlan";

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findDetailsById(id: string): Promise<UserWithPlan | null>;
  create(user: User): Promise<void>;
}
