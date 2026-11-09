import type { FastifyReply, FastifyRequest } from "fastify";

import { loginSchema } from "../../../../contracts";
import { EntityNotFoundError, WrongPasswordError } from "../../../../domain";
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
    const error = result.value;

    // Never reveal whether the email exists: both a missing user and a wrong
    // password return the same generic 401.
    if (error instanceof EntityNotFoundError || error instanceof WrongPasswordError) {
      return reply.status(401).send({
        statusCode: 401,
        error: "INVALID_CREDENTIALS",
        message: "Invalid email or password.",
      });
    }

    return handleUseCaseError(error, request, reply);
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
