import { type Either, left, right } from "../../either";
import { EntityNotFoundError } from "../../errors/entity-not-found.error";
import type { BillingCustomerRepository } from "../repositories/billing-customer.repository";
import type { BillingGateway } from "../gateways/billing-gateway.port";

interface CreatePortalSessionRequest {
  userId: string;
  returnUrl: string;
}

type CreatePortalSessionResponse = Either<
  EntityNotFoundError | Error,
  { portalUrl: string }
>;

export class CreatePortalSessionUseCase {
  constructor(
    private readonly billingCustomerRepository: BillingCustomerRepository,
    private readonly billingGateway: BillingGateway,
  ) {}

  async execute({
    userId,
    returnUrl,
  }: CreatePortalSessionRequest): Promise<CreatePortalSessionResponse> {
    // 1. Buscar customer do Stripe para este usuário.
    const billingCustomer =
      await this.billingCustomerRepository.findByUserId(userId);

    if (!billingCustomer) {
      return left(new EntityNotFoundError("BillingCustomer"));
    }

    // 2. Criar sessão do portal.
    try {
      const portal = await this.billingGateway.createPortalSession({
        customerId: billingCustomer.providerCustomerId,
        returnUrl,
      });

      if (portal.isLeft()) {
        return left(portal.value);
      }

      return right({ portalUrl: portal.value.portalUrl });
    } catch (error) {
      return left(error as Error);
    }
  }
}
