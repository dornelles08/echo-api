import type { Plan } from "../../../plan/index";

export interface UserWithPlanProps {
  id: string;
  name: string;
  email: string;
  plan: Plan;
  minutesUsed?: number;
  minutesRemaining?: number;
  cycleEnd: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class UserWithPlan {
  constructor(private readonly props: UserWithPlanProps) {
    this.props = props;
    this.props.minutesRemaining = props.minutesUsed
      ? Math.max(0, props.plan.monthlyMinutesLimit - props.minutesUsed)
      : undefined;
  }

  get id() {
    return this.props.id;
  }

  get name() {
    return this.props.name;
  }

  get email() {
    return this.props.email;
  }

  get plan() {
    return this.props.plan;
  }

  get minutesUsed() {
    return this.props.minutesUsed;
  }

  get minutesRemaining() {
    return this.props.minutesRemaining;
  }

  get cycleEnd() {
    return this.props.cycleEnd;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  set minutesUsed(minutesUsed: number | undefined) {
    this.props.minutesUsed = minutesUsed;
    this.props.minutesRemaining =
      minutesUsed !== undefined
        ? Math.max(0, this.plan.monthlyMinutesLimit - minutesUsed)
        : undefined;
  }

  set cycleEnd(cycleEnd: Date) {
    this.props.cycleEnd = cycleEnd;
  }
}
