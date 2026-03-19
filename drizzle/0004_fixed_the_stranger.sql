ALTER TABLE "shopOrders" ALTER COLUMN "status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "shopOrders" ADD COLUMN "boutiqueId" integer;--> statement-breakpoint
ALTER TABLE "shopOrders" ADD COLUMN "orderNumber" varchar(50);--> statement-breakpoint
ALTER TABLE "shopOrders" ADD COLUMN "deliveryAddress" text;--> statement-breakpoint
ALTER TABLE "shopOrders" ADD COLUMN "customerPhone" varchar(20);--> statement-breakpoint
ALTER TABLE "shopOrders" ADD COLUMN "updatedAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL;--> statement-breakpoint
ALTER TABLE "userCredits" ADD COLUMN "totalCredits" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "userCredits" ADD COLUMN "usedCredits" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "userCredits" ADD COLUMN "remainingCredits" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "userCredits" DROP COLUMN "credits";--> statement-breakpoint
ALTER TABLE "shopOrders" ADD CONSTRAINT "shopOrders_orderNumber_unique" UNIQUE("orderNumber");