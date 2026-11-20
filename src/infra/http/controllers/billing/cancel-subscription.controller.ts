import type { FastifyReply, FastifyRequest } from "fastify";

import { cancelSubscriptionBodySchema } from "../../../../contracts";
import { makeCancelSubscriptionUseCase } from "../../../factories/billing/cancel-subscription.factory";
import { handleUseCaseError } from "../../handlers/handle-use-case-error";

export async function cancelSubscription(request: FastifyRequest, reply: FastifyReply) {
  const { sub: userId } = request.user;

  const result = await makeCancelSubscriptionUseCase().execute({ userId });

  if (result.isLeft()) {
    return handleUseCaseError(result.value, request, reply);
  }

  return reply.status(200).send(result.value);
}
