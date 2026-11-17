import { pgClient } from ".";
import { plansSeed } from "./seeds/plans";
import { summaryTemplatesSeed } from "./seeds/summary-templates";

async function seed() {
  console.log("Seeding plans...");

  for (const plan of plansSeed) {
    await pgClient`
      INSERT INTO plans (
        code, name, description, price, price_cents, currency, billing_interval,
        monthly_minutes_limit, allow_video_upload,
        audio_retention_days, video_retention_days, max_summary_attempts_per_media, is_active
      )
      VALUES (
        ${plan.code}, ${plan.name}, ${plan.description}, ${plan.price}, ${plan.priceCents},
        ${plan.currency}, ${plan.billingInterval}, ${plan.monthlyMinutesLimit},
        ${plan.allowVideoUpload}, ${plan.audioRetentionDays}, ${plan.videoRetentionDays},
        ${plan.maxSummaryAttemptsPerMedia}, ${plan.isActive}
      )
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        price = EXCLUDED.price,
        price_cents = EXCLUDED.price_cents,
        currency = EXCLUDED.currency,
        billing_interval = EXCLUDED.billing_interval,
        monthly_minutes_limit = EXCLUDED.monthly_minutes_limit,
        allow_video_upload = EXCLUDED.allow_video_upload,
        audio_retention_days = EXCLUDED.audio_retention_days,
        video_retention_days = EXCLUDED.video_retention_days,
        max_summary_attempts_per_media = EXCLUDED.max_summary_attempts_per_media,
        is_active = EXCLUDED.is_active,
        updated_at = now()
    `;
  }

  console.log("Seeding summary templates...");

  for (const template of summaryTemplatesSeed) {
    await pgClient`
      INSERT INTO summary_templates (label, description, prompt)
      VALUES (${template.label}, ${template.description}, ${template.prompt})
      ON CONFLICT (label) DO NOTHING
    `;
  }

  console.log(
    `Seeded ${plansSeed.length} plans and ${summaryTemplatesSeed.length} summary templates.`,
  );
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await pgClient.end();
  });
