import { and, eq, isNotNull, sql } from "drizzle-orm";

import type {
  ExpiredStorageFile,
  ExpiredStorageFilesRepository,
} from "../../../../domain/file/repositories/expired-storage-files.repository";
import { db } from "..";
import { medias, plans, users } from "../schema";

export class DrizzleExpiredStorageFilesRepository implements ExpiredStorageFilesRepository {
  async findExpired(now: Date): Promise<ExpiredStorageFile[]> {
    const rows = await db
      .select({ id: medias.id, storageKey: medias.storageKey })
      .from(medias)
      .innerJoin(users, eq(users.id, medias.userId))
      .innerJoin(plans, eq(plans.id, users.planId))
      .where(
        and(
          isNotNull(medias.storageKey),
          sql`(
            (${medias.type} = 'audio' AND ${plans.audioRetentionDays} > 0
              AND ${medias.createdAt} + make_interval(days => ${plans.audioRetentionDays}) <= ${now})
            OR
            (${medias.type} = 'video' AND ${plans.videoRetentionDays} > 0
              AND ${medias.createdAt} + make_interval(days => ${plans.videoRetentionDays}) <= ${now})
          )`,
        ),
      );

    return rows.flatMap((row) =>
      row.storageKey ? [{ id: row.id, storageKey: row.storageKey }] : [],
    );
  }

  async clearStorageKey(id: string): Promise<void> {
    await db.update(medias).set({ storageKey: null, url: "" }).where(eq(medias.id, id));
  }
}
