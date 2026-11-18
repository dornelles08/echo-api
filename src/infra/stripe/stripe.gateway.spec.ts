import Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  BillingConnectionError,
  BillingGatewayError,
  BillingRateLimitError,
  PaymentCardError,
} from "../../domain/billing/use-cases/errors";
import { StripeGateway } from "./stripe.gateway";

// Mock do módulo stripe.client para evitar dependência de rede.
vi.mock("./stripe.client", () => ({
  getStripeClient: vi.fn(),
}));

import { getStripeClient } from "./stripe.client";

const mockGetStripeClient = getStripeClient as ReturnType<typeof vi.fn>;

function makeMockStripeClient(overrides: Record<string, unknown> = {}) {
  const customers = {
    list: vi.fn(),
    create: vi.fn(),
  };
  const checkout = {
    sessions: {
      create: vi.fn(),
    },
  };
  const subscriptions = {
    create: vi.fn(),
    update: vi.fn(),
  };
  const billingPortal = {
    sessions: {
      create: vi.fn(),
    },
  };
  const webhooks = {
    constructEvent: vi.fn(),
  };

  return {
    customers,
    checkout,
    subscriptions,
    billingPortal,
    webhooks,
    ...overrides,
  } as unknown as ReturnType<typeof getStripeClient>;
}

beforeEach(() => {
  vi.resetAllMocks();
  mockGetStripeClient.mockReturnValue(makeMockStripeClient());
});

describe("StripeGateway", () => {
  describe("createCustomer", () => {
    it("should create a new customer when none exists", async () => {
      const client = makeMockStripeClient({
        customers: {
          list: vi.fn().mockResolvedValue({ data: [] }),
          create: vi.fn().mockResolvedValue({
            id: "cus_123",
            metadata: { userId: "user-1" },
          }),
        },
      });
      mockGetStripeClient.mockReturnValue(client);

      const gateway = new StripeGateway();
      const result = await gateway.createCustomer({
        userId: "user-1",
        email: "test@example.com",
      });

      expect(result.customerId).toBe("cus_123");
      expect(client.customers.create).toHaveBeenCalledWith(
        {
          email: "test@example.com",
          metadata: { userId: "user-1" },
        },
        expect.anything(),
      );
    });

    it("should reuse existing customer by email and userId", async () => {
      const client = makeMockStripeClient({
        customers: {
          list: vi.fn().mockResolvedValue({
            data: [{ id: "cus_existing", metadata: { userId: "user-1" } }],
          }),
          create: vi.fn(),
        },
      });
      mockGetStripeClient.mockReturnValue(client);

      const gateway = new StripeGateway();
      const result = await gateway.createCustomer({
        userId: "user-1",
        email: "test@example.com",
      });

      expect(result.customerId).toBe("cus_existing");
      expect(client.customers.create).not.toHaveBeenCalled();
    });
  });

  describe("createCheckoutSession", () => {
    it("should create a checkout session and return URL", async () => {
      const client = makeMockStripeClient({
        checkout: {
          sessions: {
            create: vi.fn().mockResolvedValue({
              id: "cs_123",
              url: "https://checkout.stripe.com/sessions/cs_123",
            }),
          },
        },
      });
      mockGetStripeClient.mockReturnValue(client);

      const gateway = new StripeGateway();
      const result = await gateway.createCheckoutSession({
        customerId: "cus_123",
        priceId: "price_123",
        clientReferenceId: "sub_123",
        successUrl: "https://echo.app/success",
        cancelUrl: "https://echo.app/cancel",
      });

      expect(result.checkoutUrl).toBe("https://checkout.stripe.com/sessions/cs_123");
      expect(result.checkoutSessionId).toBe("cs_123");
      expect(client.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: "subscription",
          payment_method_types: ["card"],
          customer: "cus_123",
          client_reference_id: "sub_123",
        }),
        expect.anything(),
      );
    });

    it("should throw when checkout session returns no URL", async () => {
      const client = makeMockStripeClient({
        checkout: {
          sessions: {
            create: vi.fn().mockResolvedValue({
              id: "cs_123",
              url: undefined,
            }),
          },
        },
      });
      mockGetStripeClient.mockReturnValue(client);

      const gateway = new StripeGateway();
      await expect(
        gateway.createCheckoutSession({
          customerId: "cus_123",
          priceId: "price_123",
          clientReferenceId: "sub_123",
          successUrl: "https://echo.app/success",
          cancelUrl: "https://echo.app/cancel",
        }),
      ).rejects.toThrow(BillingGatewayError);
    });
  });

  describe("createSubscription", () => {
    it("should create a subscription", async () => {
      const client = makeMockStripeClient({
        subscriptions: {
          create: vi.fn().mockResolvedValue({
            id: "sub_123",
            status: "incomplete",
          }),
        },
      });
      mockGetStripeClient.mockReturnValue(client);

      const gateway = new StripeGateway();
      const result = await gateway.createSubscription({
        customerId: "cus_123",
        priceId: "price_123",
        paymentBehavior: "default_incomplete",
      });

      expect(result.subscriptionId).toBe("sub_123");
      expect(client.subscriptions.create).toHaveBeenCalledWith(
        {
          customer: "cus_123",
          items: [{ price: "price_123" }],
          payment_behavior: "default_incomplete",
          expand: ["latest_invoice.payment_intent"],
          metadata: undefined,
        },
        expect.anything(),
      );
    });
  });

  describe("updateSubscription", () => {
    it("should update a subscription with proration_behavior=none", async () => {
      const client = makeMockStripeClient({
        subscriptions: {
          update: vi.fn().mockResolvedValue({
            id: "sub_123",
            status: "active",
            cancel_at_period_end: false,
          }),
        },
      });
      mockGetStripeClient.mockReturnValue(client);

      const gateway = new StripeGateway();
      const result = await gateway.updateSubscription({
        subscriptionId: "sub_123",
        priceId: "price_456",
        prorationBehavior: "none",
      });

      expect(result.subscriptionId).toBe("sub_123");
      expect(client.subscriptions.update).toHaveBeenCalledWith(
        "sub_123",
        {
          items: [{ id: "sub_123", price: "price_456" }],
          proration_behavior: "none",
          cancel_at_period_end: false,
          metadata: undefined,
        },
        expect.anything(),
      );
    });
  });

  describe("cancelSubscription", () => {
    it("should set cancel_at_period_end=true", async () => {
      const client = makeMockStripeClient({
        subscriptions: {
          update: vi.fn().mockResolvedValue({
            id: "sub_123",
            cancel_at_period_end: true,
          }),
        },
      });
      mockGetStripeClient.mockReturnValue(client);

      const gateway = new StripeGateway();
      const result = await gateway.cancelSubscription({
        subscriptionId: "sub_123",
        cancelAtPeriodEnd: true,
      });

      expect(result.subscriptionId).toBe("sub_123");
      expect(client.subscriptions.update).toHaveBeenCalledWith(
        "sub_123",
        { cancel_at_period_end: true },
        expect.anything(),
      );
    });

    it("should set cancel_at_period_end=false", async () => {
      const client = makeMockStripeClient({
        subscriptions: {
          update: vi.fn().mockResolvedValue({
            id: "sub_123",
            cancel_at_period_end: false,
          }),
        },
      });
      mockGetStripeClient.mockReturnValue(client);

      const gateway = new StripeGateway();
      const result = await gateway.cancelSubscription({
        subscriptionId: "sub_123",
        cancelAtPeriodEnd: false,
      });

      expect(result.subscriptionId).toBe("sub_123");
      expect(client.subscriptions.update).toHaveBeenCalledWith(
        "sub_123",
        { cancel_at_period_end: false },
        expect.anything(),
      );
    });
  });

  describe("createPortalSession", () => {
    it("should create a portal session and return URL", async () => {
      const client = makeMockStripeClient({
        billingPortal: {
          sessions: {
            create: vi.fn().mockResolvedValue({
              id: "bps_123",
              url: "https://billing.stripe.com/session/bps_123",
            }),
          },
        },
      });
      mockGetStripeClient.mockReturnValue(client);

      const gateway = new StripeGateway();
      const result = await gateway.createPortalSession({
        customerId: "cus_123",
        returnUrl: "https://echo.app/account",
      });

      expect(result.portalUrl).toBe("https://billing.stripe.com/session/bps_123");
    });
  });

  describe("constructWebhookEvent", () => {
    it("should validate and return the event", async () => {
      const client = makeMockStripeClient({
        webhooks: {
          constructEvent: vi.fn().mockReturnValue({
            id: "evt_123",
            type: "invoice.paid",
          }),
        },
      });
      mockGetStripeClient.mockReturnValue(client);

      const gateway = new StripeGateway();
      const result = await gateway.constructWebhookEvent({
        signature: "t=123,v1=abc",
        payload: Buffer.from("{}"),
      });

      expect(result.id).toBe("evt_123");
      expect(result.type).toBe("invoice.paid");
    });
  });

  describe("error mapping", () => {
    it("should map StripeCardError to PaymentCardError", async () => {
      const client = makeMockStripeClient({
        checkout: {
          sessions: {
            create: vi.fn().mockRejectedValue(
              // biome-ignore lint/suspicious/noExplicitAny: mock de erro do Stripe SDK em teste
              new (Stripe.errors.StripeCardError as any)("Card declined", {
                statusCode: 402,
              }),
            ),
          },
        },
      });
      mockGetStripeClient.mockReturnValue(client);

      const gateway = new StripeGateway();
      await expect(
        gateway.createCheckoutSession({
          customerId: "cus_123",
          priceId: "price_123",
          clientReferenceId: "sub_123",
          successUrl: "https://echo.app/success",
          cancelUrl: "https://echo.app/cancel",
        }),
      ).rejects.toThrow(PaymentCardError);
    });

    it("should map StripeRateLimitError to BillingRateLimitError", async () => {
      const client = makeMockStripeClient({
        customers: {
          list: vi.fn().mockRejectedValue(
            // biome-ignore lint/suspicious/noExplicitAny: mock de erro do Stripe SDK em teste
            new (Stripe.errors.StripeRateLimitError as any)("Rate limited", {
              statusCode: 429,
            }),
          ),
        },
      });
      mockGetStripeClient.mockReturnValue(client);

      const gateway = new StripeGateway();
      await expect(
        gateway.createCustomer({ userId: "user-1", email: "test@example.com" }),
      ).rejects.toThrow(BillingRateLimitError);
    });

    it("should map StripeConnectionError to BillingConnectionError", async () => {
      const client = makeMockStripeClient({
        customers: {
          list: vi.fn().mockRejectedValue(
            // biome-ignore lint/suspicious/noExplicitAny: mock de erro do Stripe SDK em teste
            new (Stripe.errors.StripeConnectionError as any)("Connection failed", {
              statusCode: 0,
            }),
          ),
        },
      });
      mockGetStripeClient.mockReturnValue(client);

      const gateway = new StripeGateway();
      await expect(
        gateway.createCustomer({ userId: "user-1", email: "test@example.com" }),
      ).rejects.toThrow(BillingConnectionError);
    });

    it("should map generic StripeError to BillingGatewayError", async () => {
      const client = makeMockStripeClient({
        customers: {
          list: vi.fn().mockRejectedValue(
            // biome-ignore lint/suspicious/noExplicitAny: mock de erro do Stripe SDK em teste
            new (Stripe.errors.StripeError as any)("Generic error", {
              statusCode: 500,
            }),
          ),
        },
      });
      mockGetStripeClient.mockReturnValue(client);

      const gateway = new StripeGateway();
      await expect(
        gateway.createCustomer({ userId: "user-1", email: "test@example.com" }),
      ).rejects.toThrow(BillingGatewayError);
    });
  });
});
