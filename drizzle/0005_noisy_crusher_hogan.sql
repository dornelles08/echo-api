CREATE TABLE "billing_customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" text DEFAULT 'stripe' NOT NULL,
	"provider_customer_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "billing_customers" ADD CONSTRAINT "billing_customers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "billing_customers_user_id_provider_unique" ON "billing_customers" USING btree ("user_id","provider");--> statement-breakpoint
CREATE UNIQUE INDEX "billing_customers_provider_customer_unique" ON "billing_customers" USING btree ("provider","provider_customer_id");--> statement-breakpoint
CREATE INDEX "billing_customers_user_id_idx" ON "billing_customers" USING btree ("user_id");