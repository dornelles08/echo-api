import { type Either, right } from "../../either";
import type { SummaryTemplate } from "../entities";
import type { SummaryTemplateRepository } from "../repositories";

type FetchSummaryTemplateResponse = Either<
  null,
  {
    summaryTemplate: SummaryTemplate[];
  }
>;

export class FetchSummaryTemplatesUseCase {
  constructor(private summaryTemplateRepository: SummaryTemplateRepository) {}

  async execute(): Promise<FetchSummaryTemplateResponse> {
    const summaryTemplate = await this.summaryTemplateRepository.findAll();

    return right({ summaryTemplate });
  }
}
