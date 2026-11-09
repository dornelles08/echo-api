import { AppError } from "../../../errors/app-error";

export class WrongPasswordError extends AppError {
  constructor() {
    super("Wrong password.", 401, "WRONG_PASSWORD");
  }
}
