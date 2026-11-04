import { faker } from "@faker-js/faker";

import {
  SummaryTemplate,
  type SummaryTemplateProps,
} from "../../summary-template/entities/SummaryTemplate";

export function makeSummryTemplateFactory(
  overrides: Partial<SummaryTemplateProps> = {},
  id?: string,
) {
  const summaryTemplate = SummaryTemplate.create(
    {
      label: faker.lorem.sentence(),
      description: faker.lorem.sentence(),
      prompt: faker.lorem.sentence(),
      ...overrides,
    },
    id,
  );

  return summaryTemplate;
}
