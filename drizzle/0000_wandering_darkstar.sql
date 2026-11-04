CREATE TYPE "public"."media_status" AS ENUM('pending_transcription', 'processing_transcription', 'failed_transcription', 'transcribed', 'pending_summary', 'processing_summary', 'failed_summary', 'summarized');--> statement-breakpoint
CREATE TYPE "public"."media_type" AS ENUM('audio', 'video');--> statement-breakpoint
CREATE TABLE "medias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"filename" text NOT NULL,
	"url" text NOT NULL,
	"storage_key" text,
	"type" "media_type" NOT NULL,
	"status" "media_status" DEFAULT 'pending_transcription' NOT NULL,
	"prompt" text,
	"language" text NOT NULL,
	"transcription" text,
	"duration" double precision NOT NULL,
	"summary" text[] DEFAULT '{}'::text[] NOT NULL,
	"summary_prompt" text,
	"summary_attempts" integer DEFAULT 0 NOT NULL,
	"usage_debited_at" timestamp with time zone,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"segments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"price" double precision DEFAULT 0 NOT NULL,
	"monthly_minutes_limit" integer NOT NULL,
	"allow_video_upload" boolean DEFAULT false NOT NULL,
	"audio_retention_days" integer DEFAULT 0 NOT NULL,
	"video_retention_days" integer DEFAULT 0 NOT NULL,
	"max_summary_attempts_per_media" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "summary_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"prompt" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_counters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"cycle_start" timestamp with time zone NOT NULL,
	"cycle_end" timestamp with time zone NOT NULL,
	"minutes_used" double precision DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"plan_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "medias" ADD CONSTRAINT "medias_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_counters" ADD CONSTRAINT "usage_counters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "medias_user_id_idx" ON "medias" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "medias_status_idx" ON "medias" USING btree ("status");--> statement-breakpoint
CREATE INDEX "medias_tags_idx" ON "medias" USING gin ("tags");--> statement-breakpoint
CREATE UNIQUE INDEX "plans_name_unique" ON "plans" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "summary_templates_label_unique" ON "summary_templates" USING btree ("label");--> statement-breakpoint
CREATE UNIQUE INDEX "usage_counters_user_id_unique" ON "usage_counters" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_plan_id_idx" ON "users" USING btree ("plan_id");