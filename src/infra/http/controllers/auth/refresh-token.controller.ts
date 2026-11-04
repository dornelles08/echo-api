import type { FastifyReply, FastifyRequest } from "fastify";

import { env } from "../../../env";
import { refreshCookieOptions } from "../../cookies";

export async function refreshToken(request: FastifyRequest, reply: FastifyReply) {
  const { sub: userId } = request.user;

  const token = await reply.jwtSign({ sub: userId }, { expiresIn: env.JWT_EXPIRES_IN });
  const refreshToken = await reply.jwtSign(
    { sub: userId },
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN },
  );

  return reply
    .status(200)
    .setCookie("refreshToken", refreshToken, refreshCookieOptions())
    .send({ token });
}
