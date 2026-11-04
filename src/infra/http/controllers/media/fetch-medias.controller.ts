import type { FastifyReply, FastifyRequest } from "fastify";
import { fetchMediasQuerySchema } from "../../../../contracts/index";
import { makeFetchMediasUseCase } from "../../../factories/media/fetch-medias.factory";
import { MediaPresenter } from "../../presenters/media.presenter";

export async function fetchMedias(request: FastifyRequest, reply: FastifyReply) {
  const { page, perPage, tags, type, status, language } = fetchMediasQuerySchema.parse(
    request.query,
  );

  const { sub: userId } = request.user;

  const fetchMediasUseCase = makeFetchMediasUseCase();

  const result = await fetchMediasUseCase.execute({
    perPage,
    page,
    userId,
    language,
    tags,
    type,
    status,
  });

  if (result.isLeft()) {
    return reply.status(500).send();
  }

  const { medias, meta } = result.value;

  return reply.status(200).send(MediaPresenter.toHTTPCollection(medias, meta));
}
