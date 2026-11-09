import type { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";

import { AppError } from "../../domain/errors/app-error";

/**
 * Structured error body returned to the client.
 */
export interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  details?: unknown;
}

/**
 * Outcome of normalizing an unknown error into an operational AppError,
 * optionally carrying extra details (ex.: Zod validation issues).
 */
interface NormalizedError {
  error: AppError;
  details?: unknown;
}

/**
 * Extracts an operational AppError from an unknown value, falling back to a
 * generic 500 when the error is unexpected.
 */
export function normalizeError(error: unknown): NormalizedError {
  if (error instanceof AppError) {
    return { error };
  }

  // Zod validation errors raised by Fastify (schema.parse in controllers).
  if (error instanceof ZodError) {
    const issues = error.issues.map((issue) => ({
      path: issue.path.join("."),
      code: issue.code,
      message: issue.message,
    }));
    return {
      error: new AppError("Validation error", 400, "VALIDATION_ERROR", true),
      details: issues,
    };
  }

  return {
    error: new AppError(
      error instanceof Error ? error.message : String(error),
      500,
      "INTERNAL_SERVER_ERROR",
      false,
    ),
  };
}

/**
 * Logs the error with rich context and returns a structured HTTP response.
 *
 * Operational errors (isOperational === true) expose their message and code
 * to the client. Unexpected errors return a generic 500 and have their full
 * stack trace logged so they can be investigated.
 */
export function handleError(
  error: unknown,
  request: FastifyRequest,
  reply: FastifyReply,
): FastifyReply {
  const { error: appError, details } = normalizeError(error);

  const logContext = {
    statusCode: appError.statusCode,
    code: appError.code,
    isOperational: appError.isOperational,
    requestId: request.id,
    method: request.method,
    url: request.url,
    params: request.params,
    query: request.query,
    body: request.body,
    userId: (request.user as { sub?: string } | undefined)?.sub,
    validationIssues: details,
    stack: appError.stack,
  };

  if (appError.isOperational) {
    request.log.warn(logContext, appError.message);
  } else {
    request.log.error(logContext, "Unexpected error");
  }

  const isDev = process.env.NODE_ENV !== "production";

  const response: ErrorResponse = {
    statusCode: appError.statusCode,
    error: appError.code,
    message: appError.isOperational ? appError.message : "Internal server error",
    details,
  };

  if (!appError.isOperational && isDev) {
    response.details = appError.stack;
  }

  return reply.status(appError.statusCode).send(response);
}
