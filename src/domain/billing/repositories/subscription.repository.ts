import type { Subscription } from "../entities";

export interface SubscriptionRepository {
  findByUserId(userId: string): Promise<Subscription[]>;
  findByProviderSubscriptionId(providerSubscriptionId: string): Promise<Subscription | null>;
  findLiveByUserId(userId: string): Promise<Subscription | null>;
  create(subscription: Subscription): Promise<void>;
  update(subscription: Subscription): Promise<void>;
  attachProviderData(
    userId: string,
    providerCustomerId: string,
    providerSubscriptionId: string,
  ): Promise<void>;
}
