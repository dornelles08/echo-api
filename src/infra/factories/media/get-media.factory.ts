import { GetMediaUseCase } from "../../../domain/media/use-cases/get-medias";
import { DrizzleMediaRepository } from "../../database/drizzle/repositories/drizzle-media.repository";

export function makeGetMediaUseCase() {
  return new GetMediaUseCase(new DrizzleMediaRepository());
}
