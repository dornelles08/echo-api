import { RevokeTokenUseCase } from "../../../domain/user/use-cases/revoke-token";
import { DrizzleRevokedTokenRepository } from "../../database/drizzle/repositories/drizzle-revoked-token.repository";

export function makeRevokeTokenUseCase() {
  return new RevokeTokenUseCase(new DrizzleRevokedTokenRepository());
}
