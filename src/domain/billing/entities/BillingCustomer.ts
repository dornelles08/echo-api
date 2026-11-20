import { Entity } from "../../entity";

export interface BillingCustomerProps {
  userId: string;
  provider: string;
  providerCustomerId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class BillingCustomer extends Entity<BillingCustomerProps> {
  get userId() {
    return this.props.userId;
  }

  get provider() {
    return this.props.provider;
  }

  get providerCustomerId() {
    return this.props.providerCustomerId;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  static create(props: BillingCustomerProps, id?: string) {
    const billingCustomer = new BillingCustomer(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
    return billingCustomer;
  }
}
