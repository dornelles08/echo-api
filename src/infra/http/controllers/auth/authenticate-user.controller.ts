import type { FastifyReply, FastifyRequest } from "fastify";

import { loginSchema } from "../../../../contracts";
import { EntityNotFoundError, WrongPasswordError } from "../../../../domain";
import { env } from "../../../env";
import { makeAuthenticateUserUseCase } from "../../../factories/user/authenticate-user.factory";
import { refreshCookieOptions } from "../../cookies";

export async function authenticateUser(request: FastifyRequest, reply: FastifyReply) {
  const { email, password } = loginSchema.parse(request.body);

  const result = await makeAuthenticateUserUseCase().execute({
    email,
    password,
  });

  if (result.isLeft()) {
    const error = result.value;

    switch (error.constructor) {
      case EntityNotFoundError:
      case WrongPasswordError:
        return reply.status(401).send({
          message: "Invalid email or password.",
        });
      default:
        return reply.status(500).send({
          message: "Internal server error.",
        });
    }
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
