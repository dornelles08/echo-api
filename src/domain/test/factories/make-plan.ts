import { faker } from "@faker-js/faker";

import { Plan, type PlanProps } from "../../plan/entities/Plan";

export function makePlanFactory(overrides: Partial<PlanProps> = {}, id?: string) {
  const plan = Plan.create(
    {
      name: faker.company.name(),
      description: faker.lorem.sentence(),
      price: faker.number.int({ min: 0, max: 200 }) ?? 0,
      monthlyMinutesLimit: faker.number.int({ min: 10, max: 100 }) ?? 30,
      allowVideoUpload: faker.helpers.arrayElement([true, false]),
      audioRetentionDays: faker.number.int({ min: 1, max: 30 }) ?? 7,
      maxSummaryAttemptsPerMedia: faker.number.int({ min: 1, max: 10 }) ?? 1,
      videoRetentionDays: faker.number.int({ min: 1, max: 30 }) ?? 7,
      ...overrides,
    },
    id,
  );

  return plan;
}
