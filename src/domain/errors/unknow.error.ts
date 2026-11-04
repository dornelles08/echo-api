export class UnknowError extends Error {
  constructor(data: unknown) {
    super(JSON.stringify(data));
  }
}
