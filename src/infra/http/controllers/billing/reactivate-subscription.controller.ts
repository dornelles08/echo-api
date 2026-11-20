import type { FastifyReply, FastifyRequest } from "fastify";

import { reactivateSubscriptionBodySchema } from "../../../../contracts";
import { makeReactivateSubscriptionUseCase } from "../../../factories/billing/reactivate-subscription.factory";
import { handleUseCaseError } from "../../handlers/handle-use-case-error";

export async function reactivateSubscription(request: FastifyRequest, reply: FastifyReply) {
  const { sub: userId } = request.user;

  const result = await makeReactivateSubscriptionUseCase().execute({ userId });

  if (result.isLeft()) {
    return handleUseCaseError(result.value, request, reply);
  }

  return reply.status(200).send(result.value);
}
