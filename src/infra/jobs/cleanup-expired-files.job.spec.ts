import cron from "node-cron";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { env } from "../env";

vi.mock("node-cron", () => ({
  default: {
    validate: vi.fn(),
    schedule: vi.fn(),
  },
}));

const executeMock = vi.fn();

vi.mock("../factories/file/cleanup-expired-files.factory", () => ({
  makeCleanupExpiredFilesUseCase: () => ({ execute: executeMock }),
}));

import { registerCleanupExpiredFilesJob } from "./cleanup-expired-files.job";

function makeLogger() {
  return {
    info: vi.fn(),
    error: vi.fn(),
  };
}

const originalPattern = env.CLEANUP_EXPIRED_FILES_CRON;

describe("registerCleanupExpiredFilesJob", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cron.validate).mockReturnValue(true);
    executeMock.mockResolvedValue({
      isLeft: () => false,
      value: { scanned: 2, deleted: 2, failed: 0, errors: [] },
    });
  });

  afterEach(() => {
    env.CLEANUP_EXPIRED_FILES_CRON = originalPattern;
  });

  it("does not schedule anything when the job is disabled", () => {
    env.CLEANUP_EXPIRED_FILES_CRON = "disabled";
    const logger = makeLogger();

    registerCleanupExpiredFilesJob(logger);

    expect(cron.schedule).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining("disabled"));
  });

  it("throws for an invalid cron pattern", () => {
    env.CLEANUP_EXPIRED_FILES_CRON = "not a pattern";
    vi.mocked(cron.validate).mockReturnValue(false);
    const logger = makeLogger();

    expect(() => registerCleanupExpiredFilesJob(logger)).toThrow(
      "Invalid CLEANUP_EXPIRED_FILES_CRON pattern: not a pattern",
    );
    expect(cron.schedule).not.toHaveBeenCalled();
  });

  it("schedules the job with noOverlap and logs the pattern", () => {
    env.CLEANUP_EXPIRED_FILES_CRON = "0 3 * * *";
    const logger = makeLogger();

    registerCleanupExpiredFilesJob(logger);

    expect(cron.validate).toHaveBeenCalledWith("0 3 * * *");
    expect(cron.schedule).toHaveBeenCalledWith(
      "0 3 * * *",
      expect.any(Function),
      expect.objectContaining({ noOverlap: true }),
    );
    expect(logger.info).toHaveBeenCalledWith(
      { pattern: "0 3 * * *" },
      expect.stringContaining("scheduled"),
    );
  });

  it("logs a summary when the scheduled job runs successfully", async () => {
    env.CLEANUP_EXPIRED_FILES_CRON = "0 3 * * *";
    const logger = makeLogger();

    registerCleanupExpiredFilesJob(logger);

    const callback = vi.mocked(cron.schedule).mock.calls[0]?.[1] as () => Promise<void>;
    expect(callback).toBeDefined();

    await callback();

    expect(executeMock).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(
      { scanned: 2, deleted: 2, failed: 0 },
      expect.stringContaining("deleted"),
    );
  });

  it("logs each file that failed to be deleted", async () => {
    env.CLEANUP_EXPIRED_FILES_CRON = "0 3 * * *";
    executeMock.mockResolvedValue({
      isLeft: () => false,
      value: {
        scanned: 2,
        deleted: 1,
        failed: 1,
        errors: [{ id: "media-1", error: "boom" }],
      },
    });
    const logger = makeLogger();

    registerCleanupExpiredFilesJob(logger);

    const callback = vi.mocked(cron.schedule).mock.calls[0]?.[1] as () => Promise<void>;
    await callback();

    expect(logger.error).toHaveBeenCalledWith(
      { mediaId: "media-1", error: "boom" },
      expect.stringContaining("Failed"),
    );
  });

  it("logs an error when the cleanup use case returns a Left", async () => {
    env.CLEANUP_EXPIRED_FILES_CRON = "0 3 * * *";
    executeMock.mockResolvedValue({
      isLeft: () => true,
      value: null,
    });
    const logger = makeLogger();

    registerCleanupExpiredFilesJob(logger);

    const callback = vi.mocked(cron.schedule).mock.calls[0]?.[1] as () => Promise<void>;
    await callback();

    expect(logger.error).toHaveBeenCalledWith(expect.stringContaining("failed"));
  });

  it("logs an error instead of crashing when the use case throws", async () => {
    env.CLEANUP_EXPIRED_FILES_CRON = "0 3 * * *";
    executeMock.mockRejectedValue(new Error("storage exploded"));
    const logger = makeLogger();

    registerCleanupExpiredFilesJob(logger);

    const callback = vi.mocked(cron.schedule).mock.calls[0]?.[1] as () => Promise<void>;
    await expect(callback()).resolves.toBeUndefined();

    expect(logger.error).toHaveBeenCalledWith(
      expect.any(Error),
      expect.stringContaining("crashed"),
    );
  });
});
