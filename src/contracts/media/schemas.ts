import { z } from "zod";

export const createMediaSchema = z.object({
  filename: z.string().min(1),
  url: z.string().min(1),
  storageKey: z.string().optional(),
  type: z.enum(["video", "audio"]).default("audio"),
  language: z.string().min(1),
  duration: z.number().min(0),
  prompt: z.string().optional(),
  tags: z.string().array().optional(),
});

export type CreateMediaInput = z.infer<typeof createMediaSchema>;

export const getMediaParamsSchema = z.object({
  mediaId: z.uuid(),
});

export type GetMediaParams = z.infer<typeof getMediaParamsSchema>;

export const fetchMediasQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  perPage: z.coerce.number().int().min(1).max(100).optional().default(20),
  tags: z
    .string()
    .transform((val) => val.split(","))
    .pipe(z.array(z.string()))
    .optional(),
  type: z.enum(["video", "audio"]).optional(),
  language: z.string().optional(),
  status: z
    .enum([
      "pending_transcription",
      "processing_transcription",
      "failed_transcription",
      "transcribed",
      "pending_summary",
      "processing_summary",
      "failed_summary",
      "summarized",
    ])
    .optional(),
});

export type FetchMediasQuery = z.infer<typeof fetchMediasQuerySchema>;

export const summaryMediaParamsSchema = z.object({
  mediaId: z.uuid(),
});

export type SummaryMediaParams = z.infer<typeof summaryMediaParamsSchema>;

export const retryTranscriptionParamsSchema = z.object({
  mediaId: z.uuid(),
});

export type RetryTranscriptionParams = z.infer<typeof retryTranscriptionParamsSchema>;

export const summaryMediaBodySchema = z.object({
  prompt: z.string().min(1).max(2000),
  instructions: z.string().max(2000).optional(),
});

export type SummaryMediaBody = z.infer<typeof summaryMediaBodySchema>;

export const summaryTemplateSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  prompt: z.string(),
});

export const getSummaryTemplatesResponseSchema = z.object({
  templates: z.array(summaryTemplateSchema),
});

export type SummaryTemplate = z.infer<typeof summaryTemplateSchema>;
export type GetSummaryTemplatesResponse = z.infer<typeof getSummaryTemplatesResponseSchema>;
