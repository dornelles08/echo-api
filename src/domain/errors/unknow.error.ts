import { AppError } from "./app-error";

export class UnknowError extends AppError {
  constructor(data: unknown) {
    super(JSON.stringify(data), 500, "INTERNAL_SERVER_ERROR", false);
  }
}
