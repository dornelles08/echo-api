import type { FastifyReply, FastifyRequest } from "fastify";

import { registerSchema } from "../../../../contracts";
import { makeCreateUserUseCase } from "../../../factories/user/create-user.factory";
import { handleUseCaseError } from "../../handlers/handle-use-case-error";

export async function createUser(request: FastifyRequest, reply: FastifyReply) {
  const { name, email, password } = registerSchema.parse(request.body);

  const result = await makeCreateUserUseCase().execute({
    name,
    email,
    password,
  });

  if (result.isLeft()) {
    return handleUseCaseError(result.value, request, reply);
  }

  return reply.status(201).send();
}
