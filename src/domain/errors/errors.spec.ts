import { describe, expect, it } from "vitest";

import {
  EntityNotFoundError,
  PlanLimitExceededError,
  SummaryAttemptsExceededError,
  UnknowError,
  VideoNotAllowedError,
} from "./index";

describe("Domain errors", () => {
  it("EntityNotFoundError mentions the entity name", () => {
    const error = new EntityNotFoundError("Media");

    expect(error.message).toBe("Media not found.");
    expect(error).toBeInstanceOf(Error);
  });

  it("PlanLimitExceededError has a default message and name", () => {
    const error = new PlanLimitExceededError();

    expect(error.message).toBe("Limite de minutos do plano excedido");
    expect(error.name).toBe("PlanLimitExceededError");
  });

  it("PlanLimitExceededError accepts a custom message", () => {
    const error = new PlanLimitExceededError("custom");

    expect(error.message).toBe("custom");
  });

  it("SummaryAttemptsExceededError has a default message and name", () => {
    const error = new SummaryAttemptsExceededError();

    expect(error.message).toBe("Limite de tentativas de resumo excedido para esta mídia");
    expect(error.name).toBe("SummaryAttemptsExceededError");
  });

  it("VideoNotAllowedError has a default message and name", () => {
    const error = new VideoNotAllowedError();

    expect(error.message).toBe("Seu plano não permite upload de vídeos");
    expect(error.name).toBe("VideoNotAllowedError");
  });

  it("UnknowError serializes the unknown data as JSON message", () => {
    const error = new UnknowError({ reason: "boom" });

    expect(error.message).toBe('{"reason":"boom"}');
    expect(error).toBeInstanceOf(Error);
  });
});
