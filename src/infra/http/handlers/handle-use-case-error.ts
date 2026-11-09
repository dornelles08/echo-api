import type { FastifyReply, FastifyRequest } from "fastify";

import { handleError } from "../error-handler";

/**
 * Handles the left side of a use case Either, delegating to the global error
 * handler so all responses and logs are centralized and consistent.
 *
 * Usage in a controller:
 *
 *   const result = await useCase.execute(input);
 *   if (result.isLeft()) {
 *     return handleUseCaseError(result.value, request, reply);
 *   }
 */
export function handleUseCaseError(error: unknown, request: FastifyRequest, reply: FastifyReply) {
  return handleError(error, request, reply);
}
