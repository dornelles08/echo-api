import { and, eq, isNull } from "drizzle-orm";

import { Upload } from "../../../../domain/file/entities/Upload";
import type { UploadRepository } from "../../../../domain/file/repositories/upload.repository";
import { UploadMapper } from "../mappers/upload.mapper";
import { uploads } from "../schema";
import { db } from "..";

export class DrizzleUploadRepository implements UploadRepository {
  async create(upload: Upload): Promise<void> {
    await db.insert(uploads).values(UploadMapper.toPersistence(upload));
  }

  async findByStorageKey(storageKey: string): Promise<Upload | null> {
    const [row] = await db
      .select()
      .from(uploads)
      .where(eq(uploads.storageKey, storageKey))
      .limit(1);

    return row ? UploadMapper.toDomain(row) : null;
  }

  async consumeByUserId(
    storageKey: string,
    userId: string,
  ): Promise<Upload | null> {
    const existing = await this.findByStorageKey(storageKey);

    if (!existing || existing.userId !== userId || existing.consumedAt) {
      return null;
    }

    await db
      .update(uploads)
      .set({ consumedAt: new Date() })
      .where(
        and(eq(uploads.storageKey, storageKey), isNull(uploads.consumedAt)),
      );

    const updatedRow = await db
      .update(uploads)
      .set({ consumedAt: new Date() })
      .where(
        and(eq(uploads.storageKey, storageKey), isNull(uploads.consumedAt)),
      )
      .returning();

    return updatedRow[0] ? UploadMapper.toDomain(updatedRow[0]) : null;
  }

  async findUnconsumedByUserId(userId: string): Promise<Upload[]> {
    const rows = await db
      .select()
      .from(uploads)
      .where(and(eq(uploads.userId, userId), isNull(uploads.consumedAt)))
      .orderBy(uploads.createdAt);

    return rows.map(UploadMapper.toDomain);
  }
}
