import { Entity } from "../../entity";

export interface PlanProps {
  name: string;
  description: string;
  price: number;
  monthlyMinutesLimit: number;
  allowVideoUpload: boolean;
  audioRetentionDays: number;
  videoRetentionDays: number;
  maxSummaryAttemptsPerMedia: number;
  isActive?: boolean;
}

export class Plan extends Entity<PlanProps> {
  get name() {
    return this.props.name;
  }

  get description() {
    return this.props.description;
  }

  get price() {
    return this.props.price;
  }

  get monthlyMinutesLimit() {
    return this.props.monthlyMinutesLimit;
  }

  get allowVideoUpload() {
    return this.props.allowVideoUpload;
  }

  get audioRetentionDays() {
    return this.props.audioRetentionDays;
  }

  get videoRetentionDays() {
    return this.props.videoRetentionDays;
  }

  get maxSummaryAttemptsPerMedia() {
    return this.props.maxSummaryAttemptsPerMedia;
  }

  get isActive() {
    return this.props.isActive ?? true;
  }

  static create(props: PlanProps, id?: string) {
    return new Plan({ isActive: true, ...props }, id);
  }
}
