import { faker } from "@faker-js/faker";

import { Media, type MediaProps } from "../../media/entities/Media";
import type { Status } from "../../media/entities/Status";

export function makeMediaFactory(overrides: Partial<MediaProps> = {}, id?: string) {
  const media = Media.create(
    {
      filename: faker.system.fileName(),
      url: faker.internet.url(),
      type: faker.helpers.arrayElement(["video", "audio"]),
      prompt: faker.lorem.sentence(),
      language: faker.helpers.arrayElement(["en-US", "es-ES", "fr-FR", "de-DE", "pt-BR"]),
      duration: faker.number.float({ min: 0, max: 1000, fractionDigits: 2 }),
      transcription: faker.lorem.paragraph(),
      summary: [faker.lorem.paragraphs(2)],
      summaryPrompt: faker.lorem.sentence(),
      status: faker.helpers.arrayElement<Status>(["pending_transcription", "transcribed"]),
      tags: faker.helpers.arrayElements(
        ["education", "entertainment", "music", "podcast", "audiobook", "tutorial"],
        { min: 1, max: 3 },
      ),
      userId: faker.string.uuid(),
      ...overrides,
    },
    id,
  );

  return media;
}
