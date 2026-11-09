CREATE TABLE "revoked_refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "revoked_refresh_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "revoked_refresh_tokens" ADD CONSTRAINT "revoked_refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "revoked_refresh_tokens_user_id_idx" ON "revoked_refresh_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "revoked_refresh_tokens_expires_at_idx" ON "revoked_refresh_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "medias_created_at_idx" ON "medias" USING btree ("created_at");