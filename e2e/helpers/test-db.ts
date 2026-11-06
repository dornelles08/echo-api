import postgres from "postgres";

import { plansSeed } from "../../src/infra/database/drizzle/seeds/plans";
import { summaryTemplatesSeed } from "../../src/infra/database/drizzle/seeds/summary-templates";

/**
 * Cliente SQL para o schema descartável do arquivo de teste. `DATABASE_URL`
 * já aponta para o schema criado em `e2e/setup.ts` (search_path via
 * `options=-csearch_path=...`), então tabelas sem qualificação caem nele.
 */
let client: postgres.Sql | null = null;

function db(): postgres.Sql {
  if (!client) {
    client = postgres(process.env.DATABASE_URL as string, {
      max: 1,
      onnotice: () => {},
    });
  }

  return client;
}

/** Wipes all tables and re-seeds plans and summary templates. */
export async function resetTestDb(): Promise<void> {
  const sql = db();

  await sql`TRUNCATE TABLE medias, usage_counters, users, summary_templates, plans RESTART IDENTITY CASCADE`;

  for (const plan of plansSeed) {
    await sql`
      INSERT INTO plans (
        name, description, price, monthly_minutes_limit, allow_video_upload,
        audio_retention_days, video_retention_days, max_summary_attempts_per_media,
        is_active
      )
      VALUES (
        ${plan.name}, ${plan.description}, ${plan.price}, ${plan.monthlyMinutesLimit},
        ${plan.allowVideoUpload}, ${plan.audioRetentionDays}, ${plan.videoRetentionDays},
        ${plan.maxSummaryAttemptsPerMedia}, ${plan.isActive}
      )
      ON CONFLICT (name) DO NOTHING
    `;
  }

  for (const template of summaryTemplatesSeed) {
    await sql`
      INSERT INTO summary_templates (label, description, prompt)
      VALUES (${template.label}, ${template.description}, ${template.prompt})
      ON CONFLICT (label) DO NOTHING
    `;
  }
}

/** Sets the minutes already used in the current billing cycle for a user. */
export async function setMinutesUsed(userId: string, minutes: number): Promise<void> {
  const sql = db();

  await sql`
    INSERT INTO usage_counters (user_id, cycle_start, cycle_end, minutes_used)
    VALUES (
      ${userId},
      date_trunc('month', now()),
      date_trunc('month', now()) + interval '1 month - 1 microsecond',
      ${minutes}
    )
    ON CONFLICT (user_id) DO UPDATE SET minutes_used = ${minutes}
  `;
}

/** Directly marks a media as transcribed so summary endpoints can be exercised. */
export async function markMediaAsTranscribed(
  mediaId: string,
  transcription: string,
): Promise<void> {
  const sql = db();

  await sql`
    UPDATE medias
    SET transcription = ${transcription}, status = 'transcribed', updated_at = now()
    WHERE id = ${mediaId}
  `;
}

/** Raw access for assertions (e.g. cleanup job e2e). */
export function e2eSql(): postgres.Sql {
  return db();
}
