import { eq } from "drizzle-orm";

import type {
  SummaryTemplate,
  SummaryTemplateRepository,
} from "../../../../domain/summary-template";
import { db } from "..";
import { SummaryTemplateMapper } from "../mappers/summary-template.mapper";
import { summaryTemplates } from "../schema";

export class DrizzleSummaryTemplateRepository implements SummaryTemplateRepository {
  async findAll(): Promise<SummaryTemplate[]> {
    const rows = await db.select().from(summaryTemplates).orderBy(summaryTemplates.label);

    return rows.map(SummaryTemplateMapper.toDomain);
  }

  async findByLabel(label: string): Promise<SummaryTemplate | null> {
    const [row] = await db
      .select()
      .from(summaryTemplates)
      .where(eq(summaryTemplates.label, label))
      .limit(1);

    return row ? SummaryTemplateMapper.toDomain(row) : null;
  }

  async findById(id: string): Promise<SummaryTemplate | null> {
    const [row] = await db
      .select()
      .from(summaryTemplates)
      .where(eq(summaryTemplates.id, id))
      .limit(1);

    return row ? SummaryTemplateMapper.toDomain(row) : null;
  }

  async create(summaryTemplate: SummaryTemplate): Promise<void> {
    await db
      .insert(summaryTemplates)
      .values(SummaryTemplateMapper.toPersistence(summaryTemplate));
  }
}
