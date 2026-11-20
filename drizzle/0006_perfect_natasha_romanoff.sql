CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text DEFAULT 'stripe' NOT NULL,
	"provider_customer_id" text NOT NULL,
	"provider_subscription_id" text NOT NULL,
	"plan_id" uuid NOT NULL,
	"plan_code" text NOT NULL,
	"plan_name" text NOT NULL,
	"price_cents" integer NOT NULL,
	"currency" text DEFAULT 'BRL' NOT NULL,
	"billing_interval" text DEFAULT 'month' NOT NULL,
	"status" text NOT NULL,
	"billing_type" text NOT NULL,
	"current_period_start" timestamp with time zone NOT NULL,
	"current_period_end" timestamp with time zone NOT NULL,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"canceled_at" timestamp with time zone,
	"scheduled_plan_id" uuid,
	"scheduled_change_at" timestamp with time zone,
	"hosted_checkout_url" text,
	"checkout_expires_at" timestamp with time zone,
	"past_due_since" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_provider_subscription_id_unique" UNIQUE("provider_subscription_id")
);
--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_scheduled_plan_id_plans_id_fk" FOREIGN KEY ("scheduled_plan_id") REFERENCES "public"."plans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscriptions_provider_subscription_id_idx" ON "subscriptions" USING btree ("provider_subscription_id");--> statement-breakpoint
-- Índice parcial: apenas uma assinatura "viva" por usuário.
CREATE UNIQUE INDEX "subscriptions_one_live_per_user" ON "subscriptions" USING btree ("user_id") WHERE "status" IN ('PENDING', 'INCOMPLETE', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCEL_AT_PERIOD_END');