import type { PaginationParams } from "../../repositories/pagination-params";
import type { Media } from "../entities/Media";
import type { Status } from "../entities/Status";

export interface MediaFilters {
  type?: string;
  tags?: string[];
  status?: Status;
  language?: string;
}

export interface MediaRepository {
  create(media: Media): Promise<Media>;
  findAll(
    userId: string,
    filters?: MediaFilters,
    filterpagination?: PaginationParams,
  ): Promise<{
    medias: Media[];
    total: number;
  }>;
  findById(id: string, userId: string): Promise<Media | null>;
  save(media: Media): Promise<void>;
  delete(id: string): Promise<void>;
  findUserTags(userId: string): Promise<string[]>;
}
