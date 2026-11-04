import { and, arrayOverlaps, desc, eq, sql } from "drizzle-orm";

import type {
  Media,
  MediaFilters,
  MediaRepository,
  PaginationParams,
} from "../../../../domain";
import { db } from "..";
import { MediaMapper } from "../mappers/media.mapper";
import { medias } from "../schema";

export class DrizzleMediaRepository implements MediaRepository {
  async create(media: Media): Promise<Media> {
    const [row] = await db
      .insert(medias)
      .values(MediaMapper.toPersistence(media))
      .returning();

    if (!row) {
      throw new Error("Failed to create media");
    }

    media.updateId(row.id);

    return MediaMapper.toDomain(row);
  }

  async findAll(
    userId: string,
    filters?: MediaFilters,
    pagination?: PaginationParams,
  ): Promise<{ medias: Media[]; total: number }> {
    const conditions = [eq(medias.userId, userId)];

    if (filters?.type) {
      conditions.push(eq(medias.type, filters.type as "audio" | "video"));
    }

    if (filters?.status) {
      conditions.push(eq(medias.status, filters.status));
    }

    if (filters?.language) {
      conditions.push(eq(medias.language, filters.language));
    }

    const tags = filters?.tags?.filter((tag) => tag.trim() !== "");
    if (tags && tags.length > 0) {
      conditions.push(arrayOverlaps(medias.tags, tags));
    }

    const where = and(...conditions);
    const page = pagination?.page ?? 1;
    const perPage = pagination?.perPage ?? 10;

    const [rows, totals] = await Promise.all([
      db
        .select()
        .from(medias)
        .where(where)
        .orderBy(desc(medias.createdAt))
        .limit(perPage)
        .offset((page - 1) * perPage),
      db.select({ total: sql<number>`count(*)::int` }).from(medias).where(where),
    ]);

    return {
      medias: rows.map(MediaMapper.toDomain),
      total: totals[0]?.total ?? 0,
    };
  }

  async findById(id: string, userId: string): Promise<Media | null> {
    const [row] = await db
      .select()
      .from(medias)
      .where(and(eq(medias.id, id), eq(medias.userId, userId)))
      .limit(1);

    return row ? MediaMapper.toDomain(row) : null;
  }

  async save(media: Media): Promise<void> {
    await db
      .update(medias)
      .set(MediaMapper.toPersistence(media))
      .where(eq(medias.id, media.id));
  }

  async delete(id: string): Promise<void> {
    await db.delete(medias).where(eq(medias.id, id));
  }

  async findUserTags(userId: string): Promise<string[]> {
    const tag = sql<string>`unnest(${medias.tags})`.as("tag");

    const rows = await db
      .selectDistinct({ tag })
      .from(medias)
      .where(eq(medias.userId, userId));

    return rows.map((row) => row.tag).filter(Boolean);
  }
}
