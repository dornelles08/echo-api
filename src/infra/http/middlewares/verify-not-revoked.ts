import type { FastifyReply, FastifyRequest } from "fastify";

/**
 * Verifica se o refresh token do cookie foi revogado via logout.
 * Se estiver revogado, retorna 401. Útil em rotas sensíveis após logout.
 */
export async function verifyNotRevoked(request: FastifyRequest, reply: FastifyReply) {
  const refreshToken = request.cookies.refreshToken as string | undefined;

  if (!refreshToken) {
    return reply.status(401).send({ statusCode: 401, error: "UNAUTHORIZED", message: "No token" });
  }

  const { sub } = request.user as { sub: string };

  const { DrizzleRevokedTokenRepository } = await import(
    "../../database/drizzle/repositories/drizzle-revoked-token.repository"
  );

  const revokedRepo = new DrizzleRevokedTokenRepository();
  const isRevoked = await revokedRepo.isRevoked(refreshToken);

  if (isRevoked) {
    return reply.status(401).send({
      statusCode: 401,
      error: "TOKEN_REVOKED",
      message: "Token revoked. Please log in again.",
    });
  }
}
