export interface RevokedTokenRepository {
  revoke(token: string, userId: string, expiresAt: Date): Promise<void>;
  isRevoked(token: string): Promise<boolean>;
  purgeExpired(): Promise<void>;
}
