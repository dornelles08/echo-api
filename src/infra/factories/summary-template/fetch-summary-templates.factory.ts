import { FetchSummaryTemplatesUseCase } from "../../../domain/summary-template/use-cases/fetch-summary-template";
import { DrizzleSummaryTemplateRepository } from "../../database/drizzle/repositories/drizzle-summary-template.repository";

export function makeFetchSummaryTemplates() {
  return new FetchSummaryTemplatesUseCase(new DrizzleSummaryTemplateRepository());
}
