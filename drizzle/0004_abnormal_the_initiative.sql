ALTER TABLE "plans" ADD COLUMN "price_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "currency" text DEFAULT 'BRL' NOT NULL;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "billing_interval" text DEFAULT 'month' NOT NULL;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "code" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "stripe_product_id" text;--> statement-breakpoint
ALTER TABLE "plans" ADD COLUMN "stripe_price_id" text;--> statement-breakpoint
--> statement-breakpoint
-- Backfill: preenche price_cents a partir do preço legado (reais -> centavos)
-- e deriva o código do nome em minúsculas para planos já existentes.
UPDATE "plans"
SET "price_cents" = round("price" * 100),
    "code" = lower("name")
WHERE "price_cents" = 0
  AND "code" = '';--> statement-breakpoint
CREATE UNIQUE INDEX "plans_code_unique" ON "plans" USING btree ("code");