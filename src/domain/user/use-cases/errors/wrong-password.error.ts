export class WrongPasswordError extends Error {
  constructor() {
    super("Wrong Password Error");
    this.name = "WrongPasswordError";
  }
}
