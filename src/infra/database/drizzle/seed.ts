import { pgClient } from ".";
import { plansSeed } from "./seeds/plans";
import { summaryTemplatesSeed } from "./seeds/summary-templates";

async function seed() {
  console.log("Seeding plans...");

  for (const plan of plansSeed) {
    await pgClient`
      INSERT INTO plans (
        name, description, price, monthly_minutes_limit, allow_video_upload,
        audio_retention_days, video_retention_days, max_summary_attempts_per_media, is_active
      )
      VALUES (
        ${plan.name}, ${plan.description}, ${plan.price}, ${plan.monthlyMinutesLimit},
        ${plan.allowVideoUpload}, ${plan.audioRetentionDays}, ${plan.videoRetentionDays},
        ${plan.maxSummaryAttemptsPerMedia}, ${plan.isActive}
      )
      ON CONFLICT (name) DO NOTHING
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
