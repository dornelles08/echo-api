import type { FastifyReply, FastifyRequest } from "fastify";

import { changePlanBodySchema } from "../../../../contracts";
import { makeChangeSubscriptionPlanUseCase } from "../../../factories/billing/change-subscription-plan.factory";
import { handleUseCaseError } from "../../handlers/handle-use-case-error";

export async function changeSubscriptionPlan(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { sub: userId } = request.user;

  const { planId } = changePlanBodySchema.parse(request.body);

  const result = await makeChangeSubscriptionPlanUseCase().execute({
    userId,
    planId,
  });

  if (result.isLeft()) {
    return handleUseCaseError(result.value, request, reply);
  }

  return reply.status(200).send(result.value);
}
