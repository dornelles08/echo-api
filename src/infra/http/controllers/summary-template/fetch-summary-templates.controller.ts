import type { FastifyReply, FastifyRequest } from "fastify";
import { getSummaryTemplatesResponseSchema } from "../../../../contracts/index";
import { makeFetchSummaryTemplates } from "../../../factories/summary-template/fetch-summary-templates.factory";
import { handleUseCaseError } from "../../handlers/handle-use-case-error";

export async function fetchSummaryTemplates(_request: FastifyRequest, reply: FastifyReply) {
  const fetchSummaryTemplatesUseCase = makeFetchSummaryTemplates();

  const result = await fetchSummaryTemplatesUseCase.execute();

  if (result.isLeft()) {
    return handleUseCaseError(result.value, _request, reply);
  }

  const { summaryTemplate } = result.value;

  return reply
    .status(200)
    .send(getSummaryTemplatesResponseSchema.parse({ templates: summaryTemplate }));
}
