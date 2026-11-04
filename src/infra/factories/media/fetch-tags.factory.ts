import { FetchTagsUseCase } from "../../../domain/tags/use-cases/fetch-tags";
import { DrizzleMediaRepository } from "../../database/drizzle/repositories/drizzle-media.repository";

export function makeFetchTagsUseCase() {
  return new FetchTagsUseCase(new DrizzleMediaRepository());
}
