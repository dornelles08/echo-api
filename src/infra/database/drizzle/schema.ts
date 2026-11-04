import { sql } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import type { Segment } from "../../../domain/media/entities/Segment";
import type { Status } from "../../../domain/media/entities/Status";

export const mediaStatusEnum = pgEnum("media_status", [
  "pending_transcription",
  "processing_transcription",
  "failed_transcription",
  "transcribed",
  "pending_summary",
  "processing_summary",
  "failed_summary",
  "summarized",
]);

export const mediaTypeEnum = pgEnum("media_type", ["audio", "video"]);

export const plans = pgTable(
  "plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    price: doublePrecision("price").notNull().default(0),
    monthlyMinutesLimit: integer("monthly_minutes_limit").notNull(),
    allowVideoUpload: boolean("allow_video_upload").notNull().default(false),
    audioRetentionDays: integer("audio_retention_days").notNull().default(0),
    videoRetentionDays: integer("video_retention_days").notNull().default(0),
    maxSummaryAttemptsPerMedia: integer("max_summary_attempts_per_media").notNull().default(1),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("plans_name_unique").on(table.name)],
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    password: text("password").notNull(),
    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("users_email_unique").on(table.email),
    index("users_plan_id_idx").on(table.planId),
  ],
);

export const summaryTemplates = pgTable(
  "summary_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    label: text("label").notNull(),
    description: text("description").notNull().default(""),
    prompt: text("prompt").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("summary_templates_label_unique").on(table.label)],
);

export const usageCounters = pgTable(
  "usage_counters",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    cycleStart: timestamp("cycle_start", { withTimezone: true }).notNull(),
    cycleEnd: timestamp("cycle_end", { withTimezone: true }).notNull(),
    minutesUsed: doublePrecision("minutes_used").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("usage_counters_user_id_unique").on(table.userId)],
);

export const medias = pgTable(
  "medias",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    filename: text("filename").notNull(),
    url: text("url").notNull(),
    storageKey: text("storage_key"),
    type: mediaTypeEnum("type").notNull(),
    status: mediaStatusEnum("status").notNull().default("pending_transcription"),
    prompt: text("prompt"),
    language: text("language").notNull(),
    transcription: text("transcription"),
    duration: doublePrecision("duration").notNull(),
    summary: text("summary")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    summaryPrompt: text("summary_prompt"),
    summaryAttempts: integer("summary_attempts").notNull().default(0),
    usageDebitedAt: timestamp("usage_debited_at", { withTimezone: true }),
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    segments: jsonb("segments")
      .$type<Segment[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("medias_user_id_idx").on(table.userId),
    index("medias_status_idx").on(table.status),
    index("medias_tags_idx").using("gin", table.tags),
  ],
);

export type UserRow = typeof users.$inferSelect;
export type PlanRow = typeof plans.$inferSelect;
export type MediaRow = typeof medias.$inferSelect;
export type SummaryTemplateRow = typeof summaryTemplates.$inferSelect;
export type UsageCounterRow = typeof usageCounters.$inferSelect;
export type MediaStatus = Status;
