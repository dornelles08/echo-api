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
    // Legado: mantido para compatibilidade. Fonte de verdade do preço é `price_cents`.
    price: doublePrecision("price").notNull().default(0),
    priceCents: integer("price_cents").notNull().default(0),
    currency: text("currency").notNull().default("BRL"),
    billingInterval: text("billing_interval").notNull().default("month"),
    code: text("code").notNull().default(""),
    stripeProductId: text("stripe_product_id"),
    stripePriceId: text("stripe_price_id"),
    monthlyMinutesLimit: integer("monthly_minutes_limit").notNull(),
    allowVideoUpload: boolean("allow_video_upload").notNull().default(false),
    audioRetentionDays: integer("audio_retention_days").notNull().default(0),
    videoRetentionDays: integer("video_retention_days").notNull().default(0),
    maxSummaryAttemptsPerMedia: integer("max_summary_attempts_per_media").notNull().default(1),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("plans_name_unique").on(table.name),
    uniqueIndex("plans_code_unique").on(table.code),
  ],
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
    transcriptionAttempts: integer("transcription_attempts").notNull().default(0),
    usageDebitedAt: timestamp("usage_debited_at", { withTimezone: true }),
    retentionDays: integer("retention_days"),
    usageRefundedAt: timestamp("usage_refunded_at", { withTimezone: true }),
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

export const uploads = pgTable(
  "uploads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    storageKey: text("storage_key").notNull().unique(),
    filename: text("filename").notNull(),
    type: text("type").notNull(),
    durationSeconds: integer("duration_seconds").notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("uploads_user_id_idx").on(table.userId),
  ],
);

export const billingCustomers = pgTable(
  "billing_customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull().default("stripe"),
    providerCustomerId: text("provider_customer_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("billing_customers_user_id_provider_unique").on(
      table.userId,
      table.provider,
    ),
    uniqueIndex("billing_customers_provider_customer_unique").on(
      table.provider,
      table.providerCustomerId,
    ),
    index("billing_customers_user_id_idx").on(table.userId),
  ],
);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull().default("stripe"),
    providerCustomerId: text("provider_customer_id").notNull(),
    providerSubscriptionId: text("provider_subscription_id").notNull().unique(),
    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "restrict" }),
    planCode: text("plan_code").notNull(),
    planName: text("plan_name").notNull(),
    priceCents: integer("price_cents").notNull(),
    currency: text("currency").notNull().default("BRL"),
    billingInterval: text("billing_interval").notNull().default("month"),
    status: text("status").notNull(),
    billingType: text("billing_type").notNull(),
    currentPeriodStart: timestamp("current_period_start", {
      withTimezone: true,
    }).notNull(),
    currentPeriodEnd: timestamp("current_period_end", {
      withTimezone: true,
    }).notNull(),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    canceledAt: timestamp("canceled_at", { withTimezone: true }),
    scheduledPlanId: uuid("scheduled_plan_id").references(() => plans.id, {
      onDelete: "set null",
    }),
    scheduledChangeAt: timestamp("scheduled_change_at", { withTimezone: true }),
    hostedCheckoutUrl: text("hosted_checkout_url"),
    checkoutExpiresAt: timestamp("checkout_expires_at", { withTimezone: true }),
    pastDueSince: timestamp("past_due_since", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("subscriptions_user_id_idx").on(table.userId),
    index("subscriptions_provider_subscription_id_idx").on(
      table.providerSubscriptionId,
    ),
  ],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    subscriptionId: uuid("subscription_id").references(() => subscriptions.id, {
      onDelete: "set null",
    }),
    providerInvoiceId: text("provider_invoice_id").notNull().unique(),
    number: text("number").notNull(),
    amountDueCents: integer("amount_due_cents").notNull(),
    amountPaidCents: integer("amount_paid_cents").notNull(),
    currency: text("currency").notNull().default("BRL"),
    status: text("status").notNull(),
    periodStart: timestamp("period_start", {
      withTimezone: true,
    }).notNull(),
    periodEnd: timestamp("period_end", {
      withTimezone: true,
    }).notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    hostedInvoiceUrl: text("hosted_invoice_url"),
    invoicePdfUrl: text("invoice_pdf_url"),
    attemptCount: integer("attempt_count").notNull().default(0),
    failureCode: text("failure_code"),
    failureMessage: text("failure_message"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
    }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    }).notNull().defaultNow(),
  },
  (table) => [
    index("payments_user_id_idx").on(table.userId),
    index("payments_status_idx").on(table.status),
    index("payments_period_start_idx").on(table.periodStart),
  ],
);

export const billingWebhookEvents = pgTable(
  "billing_webhook_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: text("provider").notNull().default("stripe"),
    providerEventId: text("provider_event_id").notNull().unique(),
    eventType: text("event_type").notNull(),
    apiVersion: text("api_version"),
    objectId: text("object_id").notNull(),
    subscriptionId: uuid("subscription_id").references(() => subscriptions.id, {
      onDelete: "set null",
    }),
    normalizedPayload: jsonb("normalized_payload").notNull().default(sql`'{}'::jsonb`),
    processingStatus: text("processing_status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    errorSummary: text("error_summary"),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (table) => [
    index("billing_webhook_events_status_idx").on(table.processingStatus),
    index("billing_webhook_events_received_at_idx").on(table.receivedAt),
  ],
);

export type UserRow = typeof users.$inferSelect;
export type PlanRow = typeof plans.$inferSelect;
export type MediaRow = typeof medias.$inferSelect;
export type SummaryTemplateRow = typeof summaryTemplates.$inferSelect;
export type UsageCounterRow = typeof usageCounters.$inferSelect;
export type RevokedRefreshTokenRow = typeof revokedRefreshTokens.$inferSelect;
export type BillingCustomerRow = typeof billingCustomers.$inferSelect;
export type SubscriptionRow = typeof subscriptions.$inferSelect;
export type PaymentRow = typeof payments.$inferSelect;
export type BillingWebhookEventRow = typeof billingWebhookEvents.$inferSelect;
export type UploadRow = typeof uploads.$inferSelect;
export type MediaStatus = Status;
