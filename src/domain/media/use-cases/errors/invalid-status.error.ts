import { AppError } from "../../../errors/app-error";

export class InvalidStatusError extends AppError {
  constructor(message: string) {
    super(message, 400, "INVALID_STATUS");
  }
}
