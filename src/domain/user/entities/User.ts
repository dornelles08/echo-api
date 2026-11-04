import { Entity } from "../../entity";

export interface UserProps {
  name: string;
  email: string;
  passwordHash: string;
  planId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User extends Entity<UserProps> {
  get name() {
    return this.props.name;
  }

  get email() {
    return this.props.email;
  }

  get passwordHash() {
    return this.props.passwordHash;
  }

  get planId() {
    return this.props.planId;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  set planId(planId: string) {
    this.planId = planId;
  }

  static create(props: UserProps, id?: string) {
    const user = new User(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
    return user;
  }
}
