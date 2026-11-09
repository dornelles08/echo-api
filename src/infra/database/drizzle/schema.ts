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
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    // Legacy column kept for migration; BetterAuth stores credentials in `accounts`.
    password: text("password"),
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

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
  },
  (table) => [index("sessions_user_id_idx").on(table.userId)],
);

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("accounts_user_id_idx").on(table.userId)],
);

export const verifications = pgTable(
  "verifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("verifications_identifier_idx").on(table.identifier)],
);

/** Refresh tokens revogados via logout (lista negra para invalidar JWTs já emitidos). */
export const revokedRefreshTokens = pgTable(
  "revoked_refresh_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    token: text("token").notNull().unique(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("revoked_refresh_tokens_user_id_idx").on(table.userId),
    index("revoked_refresh_tokens_expires_at_idx").on(table.expiresAt),
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
    index("medias_created_at_idx").on(table.createdAt),
    index("medias_tags_idx").using("gin", table.tags),
  ],
);

export type UserRow = typeof users.$inferSelect;
export type PlanRow = typeof plans.$inferSelect;
export type MediaRow = typeof medias.$inferSelect;
export type SummaryTemplateRow = typeof summaryTemplates.$inferSelect;
export type UsageCounterRow = typeof usageCounters.$inferSelect;
export type RevokedRefreshTokenRow = typeof revokedRefreshTokens.$inferSelect;
export type MediaStatus = Status;
