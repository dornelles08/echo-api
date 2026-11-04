import { beforeEach, describe, expect, it } from "vitest";
import { makeSummryTemplateFactory } from "../../test/factories/make-summary-template";
import { InMemorySummaryTemplateRepository } from "../../test/repositories/in-memory-summary-template.repository";
import { FetchSummaryTemplatesUseCase } from "./fetch-summary-template";

describe("Fetch Summary Templates Use Case", () => {
  let summaryTemplateRepository: InMemorySummaryTemplateRepository;
  let sut: FetchSummaryTemplatesUseCase;

  beforeEach(() => {
    summaryTemplateRepository = new InMemorySummaryTemplateRepository();
    sut = new FetchSummaryTemplatesUseCase(summaryTemplateRepository);
  });

  it("should fetch all summaey templates", async () => {
    await summaryTemplateRepository.create(makeSummryTemplateFactory());
    await summaryTemplateRepository.create(makeSummryTemplateFactory());

    const result = await sut.execute();

    expect(result.isRight()).toBe(true);
    if (result.isRight()) {
      expect(result.value.summaryTemplate).toHaveLength(2);
    }
  });
});
