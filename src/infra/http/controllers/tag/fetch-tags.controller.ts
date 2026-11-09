import type { FastifyReply, FastifyRequest } from "fastify";
import { makeFetchTagsUseCase } from "../../../factories/media/fetch-tags.factory";
import { handleUseCaseError } from "../../handlers/handle-use-case-error";
import { TagPresenter } from "../../presenters/tag.presenter";

export async function fetchTags(request: FastifyRequest, reply: FastifyReply) {
  const { sub: userId } = request.user;

  const fetchTagsUseCase = makeFetchTagsUseCase();

  const result = await fetchTagsUseCase.execute({
    userId,
  });

  if (result.isLeft()) {
    return handleUseCaseError(result.value, request, reply);
  }

  const { tags } = result.value;

  return reply.status(200).send(TagPresenter.toHTTP(tags));
}
