import { fromNodeHeaders } from "better-auth/node";
import type { FastifyReply, FastifyRequest } from "fastify";
import { auth } from "../../../auth/better-auth";
import { makeRevokeTokenUseCase } from "../../../factories/user/revoke-token.factory";
import { handleUseCaseError } from "../../handlers/handle-use-case-error";

export async function revokeToken(request: FastifyRequest, reply: FastifyReply) {
  const { sub: userId } = request.user as { sub: string };

  // Obtém o refresh token do cookie (se existir) para revogá-lo.
  const refreshToken = request.cookies.refreshToken as string | undefined;

  if (refreshToken) {
    const result = await makeRevokeTokenUseCase().execute({
      userId,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    if (result.isLeft()) {
      return handleUseCaseError(result.value, request, reply);
    }
  }

  // Invalida a session do better-auth.
  try {
    await auth.api.signOut({
      headers: fromNodeHeaders(request.headers as Record<string, string>),
    });
  } catch {
    // Sign-out pode falhar se a session já estiver expirada; não é crítico.
  }

  return reply.clearCookie("refreshToken", { path: "/" }).status(200).send({
    statusCode: 200,
    message: "Logged out successfully",
  });
}
