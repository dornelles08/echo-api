import type { FastifyBaseLogger } from "fastify";
import cron from "node-cron";

import { env } from "../env";
import { makeCleanupExpiredFilesUseCase } from "../factories/file/cleanup-expired-files.factory";

type JobLogger = Pick<FastifyBaseLogger, "info" | "error">;

/**
 * Registers the recurring job that deletes storage objects of medias whose
 * plan-based file retention has elapsed (counted from the media creation).
 * The media rows are kept; only the file is removed from the storage.
 */
export function registerCleanupExpiredFilesJob(logger: JobLogger): void {
  const pattern = env.CLEANUP_EXPIRED_FILES_CRON;

  if (pattern === "disabled") {
    logger.info("Expired files cleanup job is disabled (CLEANUP_EXPIRED_FILES_CRON=disabled)");
    return;
  }

  if (!cron.validate(pattern)) {
    throw new Error(`Invalid CLEANUP_EXPIRED_FILES_CRON pattern: ${pattern}`);
  }

  cron.schedule(
    pattern,
    async () => {
      try {
        const result = await makeCleanupExpiredFilesUseCase().execute();

        if (result.isLeft()) {
          logger.error("Expired files cleanup failed");
          return;
        }

        const { scanned, deleted, failed, errors } = result.value;
        logger.info(
          { scanned, deleted, failed },
          `Expired files cleanup finished: ${deleted}/${scanned} deleted, ${failed} failed`,
        );

        for (const entry of errors) {
          logger.error({ mediaId: entry.id, error: entry.error }, "Failed to delete expired file");
        }
      } catch (error) {
        logger.error(error, "Expired files cleanup job crashed");
      }
    },
    { noOverlap: true },
  );

  logger.info({ pattern }, "Expired files cleanup job scheduled");
}
