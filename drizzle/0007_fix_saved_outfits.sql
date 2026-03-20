-- Drop the problematic savedOutfits table and recreate it with correct schema
DROP TABLE IF EXISTS "savedOutfits" CASCADE;

CREATE TABLE "savedOutfits" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" serial NOT NULL,
	"tryOnResultId" serial NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"watermarkedImageUrl" varchar(500) NOT NULL,
	"isFavorite" integer DEFAULT 0 NOT NULL,
	"comparisonNotes" text,
	"shareCount" integer DEFAULT 0 NOT NULL,
	"tags" text DEFAULT '[]',
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_saved_outfits_user" on "savedOutfits" ("userId");--> statement-breakpoint
CREATE INDEX "idx_saved_outfits_tryon" on "savedOutfits" ("tryOnResultId");--> statement-breakpoint
CREATE INDEX "idx_saved_outfits_created" on "savedOutfits" ("createdAt");--> statement-breakpoint
CREATE INDEX "idx_saved_outfits_favorite" on "savedOutfits" ("isFavorite");
