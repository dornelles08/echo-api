import type { FastifyReply, FastifyRequest } from "fastify";

import { loginSchema } from "../../../../contracts";
import { env } from "../../../env";
import { makeAuthenticateUserUseCase } from "../../../factories/user/authenticate-user.factory";
import { refreshCookieOptions } from "../../cookies";
import { handleUseCaseError } from "../../handlers/handle-use-case-error";

export async function authenticateUser(request: FastifyRequest, reply: FastifyReply) {
  const { email, password } = loginSchema.parse(request.body);

  const result = await makeAuthenticateUserUseCase().execute({
    email,
    password,
  });

  if (result.isLeft()) {
    return handleUseCaseError(result.value, request, reply);
  }

  const { user } = result.value;

  const token = await reply.jwtSign({ sub: user.id }, { expiresIn: env.JWT_EXPIRES_IN });
  const refreshToken = await reply.jwtSign(
    { sub: user.id },
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN },
  );

  return reply
    .status(200)
    .setCookie("refreshToken", refreshToken, refreshCookieOptions())
    .send({ token });
}
