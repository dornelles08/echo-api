import { AppError } from "./app-error";

export class EntityNotFoundError extends AppError {
  constructor(entity: string) {
    super(`${entity} not found.`, 404, "ENTITY_NOT_FOUND");
  }
}
