import type { FastifyReply, FastifyRequest } from "fastify";

import { checkoutSubscriptionBodySchema } from "../../../../contracts";
import { makeCreateSubscriptionCheckoutUseCase } from "../../../factories/billing/create-subscription-checkout.factory";
import { handleUseCaseError } from "../../handlers/handle-use-case-error";

export async function createSubscriptionCheckout(request: FastifyRequest, reply: FastifyReply) {
  const { sub: userId } = request.user;

  const { planId, successUrl, cancelUrl } = checkoutSubscriptionBodySchema.parse(request.body);

  const result = await makeCreateSubscriptionCheckoutUseCase().execute({
    userId,
    planId,
    successUrl,
    cancelUrl,
  });

  if (result.isLeft()) {
    return handleUseCaseError(result.value, request, reply);
  }

  return reply.status(201).send(result.value);
}
