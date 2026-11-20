import type { FastifyReply, FastifyRequest } from "fastify";

import { getSubscriptionQuerySchema } from "../../../../contracts";
import { makeGetSubscriptionUseCase } from "../../../factories/billing/get-subscription.factory";
import { handleUseCaseError } from "../../handlers/handle-use-case-error";
import { SubscriptionPresenter } from "../../presenters/billing/subscription.presenter";

export async function getSubscription(request: FastifyRequest, reply: FastifyReply) {
  const { sub: userId } = request.user;

  const result = await makeGetSubscriptionUseCase().execute({ userId });

  if (result.isLeft()) {
    return handleUseCaseError(result.value, request, reply);
  }

  const { subscription, plan } = result.value;

  return reply.status(200).send(SubscriptionPresenter.toHTTP(subscription, plan));
}
