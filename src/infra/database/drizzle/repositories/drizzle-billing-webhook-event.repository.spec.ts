import { describe, expect, it } from "vitest";

import { BillingWebhookEvent } from "../../../../domain/billing/entities/BillingWebhookEvent";
import { InMemoryBillingWebhookEventRepository } from "../../../../domain/test";

describe("BillingWebhookEventRepository (in-memory)", () => {
  it("should create and find by provider event id", async () => {
    const repo = new InMemoryBillingWebhookEventRepository();

    const event = BillingWebhookEvent.create({
      provider: "stripe",
      providerEventId: "evt_123",
      eventType: "invoice.paid",
      objectId: "in_123",
      normalizedPayload: { status: "paid" },
    });

    await repo.create(event);

    const found = await repo.findByProviderEventId("stripe", "evt_123");

    expect(found).not.toBeNull();
    expect(found?.eventType).toBe("invoice.paid");
    expect(found?.processingStatus).toBe("pending");
  });

  it("should not find duplicate event with different provider", async () => {
    const repo = new InMemoryBillingWebhookEventRepository();

    await repo.create(
      BillingWebhookEvent.create({
        provider: "stripe",
        providerEventId: "evt_123",
        eventType: "invoice.paid",
        objectId: "in_123",
        normalizedPayload: { status: "paid" },
      }),
    );

    const found = await repo.findByProviderEventId("asaas", "evt_123");

    expect(found).toBeNull();
  });

  it("should update status and mark as processed", async () => {
    const repo = new InMemoryBillingWebhookEventRepository();

    await repo.create(
      BillingWebhookEvent.create({
        provider: "stripe",
        providerEventId: "evt_123",
        eventType: "invoice.paid",
        objectId: "in_123",
        normalizedPayload: { status: "paid" },
      }),
    );

    const foundBefore = await repo.findByProviderEventId("stripe", "evt_123");
    expect(foundBefore?.processingStatus).toBe("pending");

    await repo.updateStatus(foundBefore!.id, "processed");

    const foundAfter = await repo.findByProviderEventId("stripe", "evt_123");
    expect(foundAfter?.processingStatus).toBe("processed");
    expect(foundAfter?.processedAt).not.toBeNull();
  });

  it("should claim a pending event for processing", async () => {
    const repo = new InMemoryBillingWebhookEventRepository();

    await repo.create(
      BillingWebhookEvent.create({
        provider: "stripe",
        providerEventId: "evt_1",
        eventType: "invoice.paid",
        objectId: "in_1",
        normalizedPayload: { status: "paid" },
      }),
    );

    await repo.create(
      BillingWebhookEvent.create({
        provider: "stripe",
        providerEventId: "evt_2",
        eventType: "invoice.paid",
        objectId: "in_2",
        normalizedPayload: { status: "paid" },
      }),
    );

    const claimed = await repo.claimForProcessing();

    expect(claimed).not.toBeNull();
    expect(claimed?.providerEventId).toBe("evt_1");
    expect(claimed?.processingStatus).toBe("processing");
    expect(claimed?.attempts).toBe(1);
  });

  it("should not claim the same event twice concurrently", async () => {
    const repo = new InMemoryBillingWebhookEventRepository();

    await repo.create(
      BillingWebhookEvent.create({
        provider: "stripe",
        providerEventId: "evt_1",
        eventType: "invoice.paid",
        objectId: "in_1",
        normalizedPayload: { status: "paid" },
      }),
    );

    const first = await repo.claimForProcessing();
    const second = await repo.claimForProcessing();

    expect(first).not.toBeNull();
    expect(second).toBeNull();
  });
});
