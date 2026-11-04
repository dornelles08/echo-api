import { Entity } from "../../entity";

export interface SummaryTemplateProps {
  label: string;
  description: string;
  prompt: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class SummaryTemplate extends Entity<SummaryTemplateProps> {
  static create(props: SummaryTemplateProps, id?: string) {
    const summaryTemplate = new SummaryTemplate(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
    return summaryTemplate;
  }

  get label() {
    return this.props.label;
  }

  get description() {
    return this.props.description;
  }

  get prompt() {
    return this.props.prompt;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }
}
