import type { FastifyReply, FastifyRequest } from "fastify";
import { makeGetProfileUseCase } from "../../../factories/user/get-profile.factory";
import { handleUseCaseError } from "../../handlers/handle-use-case-error";
import { UserWithPlanPresenter } from "../../presenters/user-with-plan.presenter";

export async function profile(request: FastifyRequest, reply: FastifyReply) {
  const { sub: userId } = request.user;

  const getProfileUseCase = makeGetProfileUseCase();

  const result = await getProfileUseCase.execute({
    userId,
  });

  if (result.isLeft()) {
    return handleUseCaseError(result.value, request, reply);
  }

  const { user } = result.value;

  return reply.status(200).send({ user: UserWithPlanPresenter.toHTTP(user) });
}
