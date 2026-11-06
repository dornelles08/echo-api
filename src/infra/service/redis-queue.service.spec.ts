import { beforeEach, describe, expect, it, vi } from "vitest";

const { addMock, getQueueMock, obliterateMock } = vi.hoisted(() => ({
  addMock: vi.fn(),
  obliterateMock: vi.fn(),
  getQueueMock: vi.fn(),
}));

vi.mock("../queue/redis/bullmq-connection", () => ({
  getQueue: getQueueMock,
}));

import { RedisQueueService } from "./redis-queue.service";

describe("RedisQueueService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getQueueMock.mockReturnValue({ add: addMock, obliterate: obliterateMock });
  });

  it("publish enqueues a main-job in the given queue", async () => {
    const service = new RedisQueueService();

    await service.publish("media_transcription_queue", { mediaId: "1" });

    expect(getQueueMock).toHaveBeenCalledWith("media_transcription_queue");
    expect(addMock).toHaveBeenCalledWith("main-job", { mediaId: "1" });
  });

  it("publish enqueues summary jobs in the summary queue", async () => {
    const service = new RedisQueueService();

    await service.publish("media_summary_queue", { mediaId: "2", prompt: "p" });

    expect(getQueueMock).toHaveBeenCalledWith("media_summary_queue");
    expect(addMock).toHaveBeenCalledWith("main-job", { mediaId: "2", prompt: "p" });
  });

  it("remove obliterates the queue", async () => {
    const service = new RedisQueueService();

    await service.remove("media_summary_queue", { anything: true });

    expect(getQueueMock).toHaveBeenCalledWith("media_summary_queue");
    expect(obliterateMock).toHaveBeenCalledWith({ force: true });
  });
});
