import type { FastifyReply, FastifyRequest } from "fastify";
import { getSummaryTemplatesResponseSchema } from "../../../../contracts/index";
import { makeFetchSummaryTemplates } from "../../../factories/summary-template/fetch-summary-templates.factory";

export async function fetchSummaryTemplates(_request: FastifyRequest, reply: FastifyReply) {
  const fetchSummaryTemplatesUseCase = makeFetchSummaryTemplates();

  const result = await fetchSummaryTemplatesUseCase.execute();

  if (result.isLeft()) {
    return reply.status(500).send();
  }

  const { summaryTemplate } = result.value;

  return reply
    .status(200)
    .send(getSummaryTemplatesResponseSchema.parse({ templates: summaryTemplate }));
}
