/**
 * Base class for all application errors.
 *
 * - `statusCode`: HTTP status to return to the client.
 * - `code`: stable machine-readable error code (ex.: `ENTITY_NOT_FOUND`).
 * - `isOperational`: whether the error is expected/operational (true) or a
 *   bug/unexpected failure (false). Unexpected errors are logged with stack
 *   trace and return a generic 500 to avoid leaking internals.
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly isOperational: boolean;

  constructor(message: string, statusCode: number, code: string, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    // Restore prototype chain (lost when transpiling ES5-style extends).
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
