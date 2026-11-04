import type { SummaryTemplate } from "../entities/SummaryTemplate";

export interface SummaryTemplateRepository {
  findAll(): Promise<SummaryTemplate[]>;
  findByLabel(label: string): Promise<SummaryTemplate | null>;
  findById(id: string): Promise<SummaryTemplate | null>;
  create(summaryTemplate: SummaryTemplate): Promise<void>;
}
