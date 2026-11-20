import type { FastifyReply, FastifyRequest } from "fastify";

import { paymentMethodChangeBodySchema } from "../../../../contracts";
import { makeCreatePortalSessionUseCase } from "../../../factories/billing/create-portal-session.factory";
import { handleUseCaseError } from "../../handlers/handle-use-case-error";

export async function createPortalSession(request: FastifyRequest, reply: FastifyReply) {
  const { sub: userId } = request.user;

  const { returnUrl } = paymentMethodChangeBodySchema.parse(request.body);

  const result = await makeCreatePortalSessionUseCase().execute({
    userId,
    returnUrl,
  });

  if (result.isLeft()) {
    return handleUseCaseError(result.value, request, reply);
  }

  return reply.status(200).send(result.value);
}
