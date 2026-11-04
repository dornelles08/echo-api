import { SummaryTemplate } from "../../../../domain/summary-template/entities/SummaryTemplate";
import type { SummaryTemplateRow } from "../schema";

export namespace SummaryTemplateMapper {
  export function toDomain(row: SummaryTemplateRow): SummaryTemplate {
    return SummaryTemplate.create(
      {
        label: row.label,
        description: row.description,
        prompt: row.prompt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }

  export function toPersistence(summaryTemplate: SummaryTemplate) {
    return {
      label: summaryTemplate.label,
      description: summaryTemplate.description,
      prompt: summaryTemplate.prompt,
      createdAt: summaryTemplate.createdAt,
      updatedAt: summaryTemplate.updatedAt,
    };
  }
}
