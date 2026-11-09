import { AppError } from "../../../errors/app-error";

export class EmailAlreadyExistsError extends AppError {
  constructor() {
    super("Email is already registered.", 409, "EMAIL_ALREADY_EXISTS");
  }
}
