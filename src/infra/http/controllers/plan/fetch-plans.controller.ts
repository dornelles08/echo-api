import type { FastifyReply, FastifyRequest } from "fastify";

import { fetchPlansQuerySchema } from "../../../../contracts";
import { makeFetchPlansUseCase } from "../../../factories/plan/fetch-plans.factory";
import { handleUseCaseError } from "../../handlers/handle-use-case-error";
import { PlanPresenter } from "../../presenters/plan.presenter";

export async function fetchPlans(request: FastifyRequest, reply: FastifyReply) {
  const { isActive, name } = fetchPlansQuerySchema.parse(request.query);

  const result = await makeFetchPlansUseCase().execute({ isActive, name });

  if (result.isLeft()) {
    return handleUseCaseError(result.value, request, reply);
  }

  return reply.status(200).send(PlanPresenter.toHTTP(result.value.plans));
}
