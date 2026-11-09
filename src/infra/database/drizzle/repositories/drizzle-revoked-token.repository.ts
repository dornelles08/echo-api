import { eq, sql } from "drizzle-orm";

import type { RevokedTokenRepository } from "../../../../domain/user/repositories/revoked-token.repository";
import { db } from "..";
import { revokedRefreshTokens } from "../schema";

export class DrizzleRevokedTokenRepository implements RevokedTokenRepository {
  async revoke(token: string, userId: string, expiresAt: Date): Promise<void> {
    await db.insert(revokedRefreshTokens).values({ token, userId, expiresAt });
  }

  async isRevoked(token: string): Promise<boolean> {
    const [row] = await db
      .select()
      .from(revokedRefreshTokens)
      .where(eq(revokedRefreshTokens.token, token))
      .limit(1);

    if (!row) {
      return false;
    }

    return new Date() <= row.expiresAt;
  }

  async purgeExpired(): Promise<void> {
    await db.delete(revokedRefreshTokens).where(sql`${revokedRefreshTokens.expiresAt} < now()`);
  }
}
