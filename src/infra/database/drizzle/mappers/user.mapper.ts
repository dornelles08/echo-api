import { User } from "../../../../domain/user/entities/User";
import type { UserRow } from "../schema";

export namespace UserMapper {
  export function toDomain(row: UserRow): User {
    return User.create(
      {
        name: row.name,
        email: row.email,
        passwordHash: row.password,
        planId: row.planId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }

  export function toPersistence(user: User) {
    return {
      name: user.name,
      email: user.email,
      password: user.passwordHash,
      planId: user.planId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
