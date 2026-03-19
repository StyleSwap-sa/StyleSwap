ALTER TABLE "batchUploadFiles" ALTER COLUMN "batchUploadId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "batchUploadFiles" ALTER COLUMN "batchUploadId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "batchUploads" ALTER COLUMN "boutiqueId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "batchUploads" ALTER COLUMN "boutiqueId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "boutiqueCredits" ALTER COLUMN "boutiqueId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "boutiqueSettings" ALTER COLUMN "boutiqueId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "boutiqueSubscriptions" ALTER COLUMN "boutiqueId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "boutiqueTransactions" ALTER COLUMN "boutiqueId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "boutiqueUsers" ALTER COLUMN "boutiqueId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "boutiqueUsers" ALTER COLUMN "userId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "boutiques" ALTER COLUMN "ownerId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "couponRedemptions" ALTER COLUMN "couponId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "couponRedemptions" ALTER COLUMN "userId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "emailNotifications" ALTER COLUMN "userId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "emailNotifications" ALTER COLUMN "userId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "favorites" ALTER COLUMN "userId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "favorites" ALTER COLUMN "userId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "favorites" ALTER COLUMN "garmentId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "favorites" ALTER COLUMN "garmentId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "featureAccessLogs" ALTER COLUMN "userId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "featureAccessLogs" ALTER COLUMN "userId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "garments" ALTER COLUMN "boutiqueId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "inAppNotifications" ALTER COLUMN "userId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "inAppNotifications" ALTER COLUMN "userId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "productSizeVariants" ALTER COLUMN "productId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "productSizeVariants" ALTER COLUMN "productId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "boutiqueId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "reviews" ALTER COLUMN "userId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "reviews" ALTER COLUMN "userId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ALTER COLUMN "productId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "reviews" ALTER COLUMN "productId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "savedOutfits" ALTER COLUMN "userId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "savedOutfits" ALTER COLUMN "tryOnResultId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "savedOutfits" ALTER COLUMN "isFavorite" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "savedOutfits" ALTER COLUMN "shareCount" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "shopOrders" ALTER COLUMN "userId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "shopOrders" ALTER COLUMN "userId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptionAuditLog" ALTER COLUMN "subscriptionId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "subscriptionAuditLog" ALTER COLUMN "subscriptionId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "amount" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "tryOnResults" ALTER COLUMN "userId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "tryOnResults" ALTER COLUMN "garmentId" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "tryOnResults" ALTER COLUMN "garmentId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "userCredits" ALTER COLUMN "userId" SET DATA TYPE integer;