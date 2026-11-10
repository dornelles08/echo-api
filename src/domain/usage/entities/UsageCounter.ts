import { Entity } from "../../entity";

export interface UsageCounterProps {
  userId: string;
  cycleStart: Date;
  cycleEnd: Date;
  minutesUsed: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class UsageCounter extends Entity<UsageCounterProps> {
  get userId() {
    return this.props.userId;
  }

  get cycleStart() {
    return this.props.cycleStart;
  }

  get cycleEnd() {
    return this.props.cycleEnd;
  }

  get minutesUsed() {
    return this.props.minutesUsed;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  addMinutes(minutes: number) {
    this.props.minutesUsed += minutes;
    this.props.updatedAt = new Date();
  }

  subtractMinutes(minutes: number) {
    this.props.minutesUsed = Math.max(0, this.props.minutesUsed - minutes);
    this.props.updatedAt = new Date();
  }

  isExpired(): boolean {
    return new Date() > this.props.cycleEnd;
  }

  static create(props: UsageCounterProps, id?: string) {
    const usageCounter = new UsageCounter(
      {
        ...props,
        minutesUsed: props.minutesUsed ?? 0,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
    return usageCounter;
  }

  static getCurrentCycleDates(): { cycleStart: Date; cycleEnd: Date } {
    const now = new Date();
    const cycleStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const cycleEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { cycleStart, cycleEnd };
  }
}
