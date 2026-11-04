import { z } from "zod";

export const segmentSchema = z.object({
  id: z.string(),
  start: z.number(),
  end: z.number(),
  text: z.string(),
  avg_logprob: z.number(),
  compression_ratio: z.number(),
  no_speech_prob: z.number(),
});

export type Segment = z.infer<typeof segmentSchema>;

export const statusEnum = [
  "pending_transcription",
  "processing_transcription",
  "failed_transcription",
  "transcribed",
  "pending_summary",
  "processing_summary",
  "failed_summary",
  "summarized",
] as const;

export type Status = (typeof statusEnum)[number];

export const mediaResponseSchema = z.object({
  id: z.string(),
  filename: z.string(),
  url: z.string(),
  storageKey: z.string().optional(),
  type: z.enum(["video", "audio"]).optional(),
  prompt: z.string().optional(),
  language: z.string(),
  transcription: z.string().optional(),
  duration: z.number(),
  summary: z.array(z.string()).default([]),
  summaryPrompt: z.string().optional(),
  summaryAttempts: z.number().default(0),
  status: z.enum(statusEnum),
  tags: z.array(z.string()),
  segments: z.array(segmentSchema),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type MediaResponse = z.infer<typeof mediaResponseSchema>;

export const paginationSchema = z.object({
  page: z.number(),
  perPage: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

export type PaginationResponse = z.infer<typeof paginationSchema>;

export const mediasResponseSchema = z.object({
  medias: z.array(mediaResponseSchema),
  pagination: paginationSchema,
});

export type MediasResponse = z.infer<typeof mediasResponseSchema>;
