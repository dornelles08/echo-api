import { FetchMediasUseCase } from "../../../domain/media/use-cases/fetch-medias";
import { DrizzleMediaRepository } from "../../database/drizzle/repositories/drizzle-media.repository";

export function makeFetchMediasUseCase() {
  return new FetchMediasUseCase(new DrizzleMediaRepository());
}
