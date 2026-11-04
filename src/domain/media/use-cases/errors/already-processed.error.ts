export class AlreadyProcessedError extends Error {
  constructor() {
    super("Summary already created/processed for this media.");
  }
}
