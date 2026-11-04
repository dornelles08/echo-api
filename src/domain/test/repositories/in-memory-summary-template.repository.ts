import type { SummaryTemplate, SummaryTemplateRepository } from "../../index";

export class InMemorySummaryTemplateRepository implements SummaryTemplateRepository {
  public items: SummaryTemplate[] = [];

  async findAll(): Promise<SummaryTemplate[]> {
    return this.items;
  }

  async findByLabel(label: string): Promise<SummaryTemplate | null> {
    const summaryTemplate = this.items.find((item) => item.label === label);
    return summaryTemplate ?? null;
  }

  async findById(id: string): Promise<SummaryTemplate | null> {
    const summaryTemplate = this.items.find((item) => item.id === id);
    return summaryTemplate ?? null;
  }

  async create(summaryTemplate: SummaryTemplate): Promise<void> {
    this.items.push(summaryTemplate);
  }
}
