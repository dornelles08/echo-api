import { type Either, right } from "../../either";
import type { RevokedTokenRepository } from "../repositories/revoked-token.repository";

interface RevokeTokenUseCaseRequest {
  userId: string;
  token: string;
  expiresAt: Date;
}

type RevokeTokenUseCaseResponse = Either<null, { revoked: boolean }>;

export class RevokeTokenUseCase {
  constructor(private readonly revokedTokenRepository: RevokedTokenRepository) {}

  async execute({
    userId,
    token,
    expiresAt,
  }: RevokeTokenUseCaseRequest): Promise<RevokeTokenUseCaseResponse> {
    await this.revokedTokenRepository.revoke(token, userId, expiresAt);

    return right({ revoked: true });
  }
}
