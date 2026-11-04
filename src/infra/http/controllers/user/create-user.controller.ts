import type { FastifyReply, FastifyRequest } from "fastify";

import { registerSchema } from "../../../../contracts";
import { EmailAlreadyExistsError } from "../../../../domain";
import { makeCreateUserUseCase } from "../../../factories/user/create-user.factory";

export async function createUser(request: FastifyRequest, reply: FastifyReply) {
  const { name, email, password } = registerSchema.parse(request.body);

  const result = await makeCreateUserUseCase().execute({
    name,
    email,
    password,
  });

  if (result.isLeft()) {
    const error = result.value;

    if (error instanceof EmailAlreadyExistsError) {
      return reply.status(409).send({ message: error.message });
    }

    return reply.status(500).send({ message: "Internal server error" });
  }

  return reply.status(201).send();
}
