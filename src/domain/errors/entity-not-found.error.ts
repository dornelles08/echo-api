export class EntityNotFoundError extends Error {
  constructor(entity: string) {
    super(`${entity} not found.`);
  }
}
