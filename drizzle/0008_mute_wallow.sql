CREATE TABLE "billing_webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text DEFAULT 'stripe' NOT NULL,
	"provider_event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"api_version" text,
	"object_id" text NOT NULL,
	"subscription_id" uuid,
	"normalized_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"processing_status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"error_summary" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	CONSTRAINT "billing_webhook_events_provider_event_id_unique" UNIQUE("provider_event_id")
);
--> statement-breakpoint
ALTER TABLE "billing_webhook_events" ADD CONSTRAINT "billing_webhook_events_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "billing_webhook_events_status_idx" ON "billing_webhook_events" USING btree ("processing_status");--> statement-breakpoint
CREATE INDEX "billing_webhook_events_received_at_idx" ON "billing_webhook_events" USING btree ("received_at");