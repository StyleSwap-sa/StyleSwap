CREATE TABLE "affiliateCommissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"affiliateTrackingId" integer NOT NULL,
	"affiliateLinkId" integer NOT NULL,
	"boutiqueId" integer NOT NULL,
	"clothingPurchaseAmount" numeric(12, 2) NOT NULL,
	"commissionAmount" numeric(12, 2) NOT NULL,
	"commissionRate" numeric(5, 2) DEFAULT '7.50' NOT NULL,
	"externalTransactionId" varchar(255),
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"paidAt" timestamp,
	"notes" text,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "affiliateLinks" (
	"id" serial PRIMARY KEY NOT NULL,
	"affiliateName" varchar(255) NOT NULL,
	"affiliateCode" varchar(50) NOT NULL,
	"description" text,
	"commissionRate" numeric(5, 2) DEFAULT '7.50' NOT NULL,
	"isActive" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	CONSTRAINT "affiliateLinks_affiliateCode_unique" UNIQUE("affiliateCode")
);
--> statement-breakpoint
CREATE TABLE "affiliateTracking" (
	"id" serial PRIMARY KEY NOT NULL,
	"affiliateLinkId" integer NOT NULL,
	"boutiqueId" integer NOT NULL,
	"trackingToken" varchar(255) NOT NULL,
	"source" varchar(50),
	"ipAddress" varchar(45),
	"userAgent" text,
	"isConverted" boolean DEFAULT false,
	"convertedAt" timestamp,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	CONSTRAINT "affiliateTracking_trackingToken_unique" UNIQUE("trackingToken")
);
--> statement-breakpoint
CREATE TABLE "analyticsSnapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"snapshot_date" date,
	"total_try_ons" integer,
	"successful_try_ons" integer,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "apiKeyLogs" (
	"id" serial PRIMARY KEY NOT NULL,
	"api_key_id" integer,
	"endpoint" varchar(255),
	"status" integer,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "apiKeys" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(255),
	"name" varchar(255),
	"boutique_id" integer,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "apiKeys_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "appRegistrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"appName" varchar(255) NOT NULL,
	"companyName" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"website" varchar(500) NOT NULL,
	"platformType" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"apiKey" varchar(255) NOT NULL,
	"apiSecret" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"isLiveMode" boolean DEFAULT false NOT NULL,
	"requestsCount" integer DEFAULT 0 NOT NULL,
	"lastRequestAt" timestamp,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "appRegistrations_apiKey_unique" UNIQUE("apiKey"),
	CONSTRAINT "appRegistrations_apiSecret_unique" UNIQUE("apiSecret")
);
--> statement-breakpoint
CREATE TABLE "auditLogs" (
	"id" serial PRIMARY KEY NOT NULL,
	"action" varchar(255) NOT NULL,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "batchUploadFiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"batchUploadId" serial NOT NULL,
	"file_name" varchar(255),
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "batchUploads" (
	"id" serial PRIMARY KEY NOT NULL,
	"boutiqueId" serial NOT NULL,
	"status" varchar(50),
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "boutiqueBankAccounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"boutique_id" integer,
	"bank_name" varchar(255),
	"account_number" varchar(255),
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "boutiqueCredits" (
	"id" serial PRIMARY KEY NOT NULL,
	"boutiqueId" serial NOT NULL,
	"credits" numeric(10, 2) DEFAULT '0' NOT NULL,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "boutiqueSettings" (
	"id" serial PRIMARY KEY NOT NULL,
	"boutiqueId" serial NOT NULL,
	"setting_key" varchar(255) NOT NULL,
	"setting_value" text NOT NULL,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "boutiqueSubscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"boutiqueId" serial NOT NULL,
	"subscription_type" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "boutiqueTransactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"boutiqueId" serial NOT NULL,
	"transaction_type" varchar(50) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "boutiqueUsers" (
	"id" serial PRIMARY KEY NOT NULL,
	"boutiqueId" serial NOT NULL,
	"userId" serial NOT NULL,
	"role" varchar(50) DEFAULT 'staff' NOT NULL,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "boutiqueVerifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"boutique_id" integer,
	"verification_status" varchar(50),
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "boutiques" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"logo" varchar(500),
	"ownerId" serial NOT NULL,
	"website" varchar(500),
	"instagram" varchar(255),
	"tiktok" varchar(255),
	"facebook" varchar(255),
	"whatsapp" varchar(255),
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "boutiques_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "commentNotifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"commentId" integer NOT NULL,
	"outfitId" integer NOT NULL,
	"notificationType" text NOT NULL,
	"isRead" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "couponCodes" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(50) NOT NULL,
	"description" text,
	"creditsValue" numeric(10, 2) NOT NULL,
	"maxUses" integer NOT NULL,
	"currentUses" integer DEFAULT 0 NOT NULL,
	"expiresAt" timestamp,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "couponCodes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "couponRedemptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"couponId" serial NOT NULL,
	"userId" serial NOT NULL,
	"redeemedAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deletionLogs" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_type" varchar(255),
	"entity_id" integer,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "__drizzle_migrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"hash" varchar(255) NOT NULL,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emailNotifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" serial NOT NULL,
	"email" varchar(255),
	"subject" varchar(255),
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" serial NOT NULL,
	"garmentId" serial NOT NULL,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "featureAccessLogs" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" serial NOT NULL,
	"feature_name" varchar(255),
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flaggedComments" (
	"id" serial PRIMARY KEY NOT NULL,
	"commentId" integer NOT NULL,
	"reportedBy" integer NOT NULL,
	"reason" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'pending',
	"moderatedBy" integer,
	"moderationNotes" text,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "followNotifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"followerId" integer NOT NULL,
	"followingId" integer NOT NULL,
	"isNotified" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fraudFlags" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_id" integer,
	"flag_reason" varchar(255),
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "garments" (
	"id" serial PRIMARY KEY NOT NULL,
	"boutiqueId" serial NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"image_url" varchar(500),
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hashtagUsage" (
	"id" serial PRIMARY KEY NOT NULL,
	"hashtagId" integer NOT NULL,
	"outfitId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inAppNotifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" serial NOT NULL,
	"message" text,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentionNotifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"mentionedUserId" integer NOT NULL,
	"mentionedByUserId" integer NOT NULL,
	"contextType" text NOT NULL,
	"contextId" integer NOT NULL,
	"message" text,
	"isNotified" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "moderationLogs" (
	"id" serial PRIMARY KEY NOT NULL,
	"moderatorId" integer NOT NULL,
	"action" text NOT NULL,
	"targetType" text NOT NULL,
	"targetId" integer NOT NULL,
	"reason" text,
	"notes" text,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"title" varchar(255),
	"message" text,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "onboardingStatus" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"step" varchar(50),
	"completed" boolean,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outfitComments" (
	"id" serial PRIMARY KEY NOT NULL,
	"outfitId" integer NOT NULL,
	"userId" integer NOT NULL,
	"comment" text NOT NULL,
	"likes" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outfitDiscoveryFeed" (
	"id" serial PRIMARY KEY NOT NULL,
	"outfitId" integer NOT NULL,
	"userId" integer NOT NULL,
	"imageUrl" text NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"tags" text,
	"likes" integer DEFAULT 0,
	"views" integer DEFAULT 0,
	"isPublic" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outfitLikes" (
	"id" serial PRIMARY KEY NOT NULL,
	"outfitId" integer NOT NULL,
	"userId" integer NOT NULL,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outfitReports" (
	"id" serial PRIMARY KEY NOT NULL,
	"outfitId" integer NOT NULL,
	"reportedBy" integer NOT NULL,
	"reason" varchar(255) NOT NULL,
	"description" text,
	"status" varchar(50) DEFAULT 'pending',
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outfitVotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"votingId" integer NOT NULL,
	"voterId" integer NOT NULL,
	"selectedOutfit" varchar(10) NOT NULL,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outfitVotings" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"outfitAImageUrl" text NOT NULL,
	"outfitBImageUrl" text NOT NULL,
	"outfitCImageUrl" text,
	"outfitATitle" varchar(100) DEFAULT 'Outfit A',
	"outfitBTitle" varchar(100) DEFAULT 'Outfit B',
	"outfitCTitle" varchar(100) DEFAULT 'Outfit C',
	"totalVotes" integer DEFAULT 0,
	"isActive" boolean DEFAULT true,
	"expiresAt" timestamp,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "paymentReconciliation" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_id" varchar(255),
	"status" varchar(50),
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payoutAuditLog" (
	"id" serial PRIMARY KEY NOT NULL,
	"payout_id" integer,
	"action" varchar(255),
	"details" text,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payoutTransactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"payout_id" integer,
	"transaction_id" integer,
	"amount" numeric(10, 2),
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payouts" (
	"id" serial PRIMARY KEY NOT NULL,
	"boutique_id" integer,
	"amount" numeric(10, 2),
	"status" varchar(50),
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pollVoteNotifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"pollId" integer NOT NULL,
	"voterId" integer NOT NULL,
	"pollOwnerId" integer NOT NULL,
	"selectedOutfit" varchar(10) NOT NULL,
	"isNotified" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "productSizeVariants" (
	"id" serial PRIMARY KEY NOT NULL,
	"productId" serial NOT NULL,
	"size" varchar(50),
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"boutiqueId" serial NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"image_url" varchar(500),
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pushNotificationPreferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"pollVotes" boolean DEFAULT true,
	"outfitComments" boolean DEFAULT true,
	"follows" boolean DEFAULT true,
	"mentions" boolean DEFAULT true,
	"trendingOutfits" boolean DEFAULT true,
	"allNotifications" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pushNotificationPreferences_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "pushNotifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"notificationType" text NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"relatedUserId" integer,
	"relatedOutfitId" integer,
	"relatedPollId" integer,
	"isRead" boolean DEFAULT false,
	"actionUrl" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referralLinks" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"outfitId" integer NOT NULL,
	"referralCode" varchar(50) NOT NULL,
	"shortUrl" varchar(255),
	"platform" varchar(50),
	"clicks" integer DEFAULT 0,
	"signups" integer DEFAULT 0,
	"isActive" boolean DEFAULT true,
	"expiresAt" timestamp,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	CONSTRAINT "referralLinks_referralCode_unique" UNIQUE("referralCode")
);
--> statement-breakpoint
CREATE TABLE "referralTracking" (
	"id" serial PRIMARY KEY NOT NULL,
	"referralLinkId" integer NOT NULL,
	"referredUserId" integer,
	"referrerUserId" integer NOT NULL,
	"platform" varchar(50),
	"ipAddress" varchar(45),
	"userAgent" text,
	"conversionStatus" varchar(50) DEFAULT 'clicked',
	"convertedAt" timestamp,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" serial NOT NULL,
	"productId" serial NOT NULL,
	"rating" integer,
	"comment" text,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "savedOutfits" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" serial NOT NULL,
	"tryOnResultId" serial NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"watermarkedImageUrl" varchar(500) NOT NULL,
	"isFavorite" serial DEFAULT 0 NOT NULL,
	"comparisonNotes" text,
	"shareCount" serial DEFAULT 0 NOT NULL,
	"tags" text DEFAULT '[]',
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shopOrders" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" serial NOT NULL,
	"total_amount" numeric(10, 2),
	"status" varchar(50),
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptionAuditLog" (
	"id" serial PRIMARY KEY NOT NULL,
	"subscriptionId" serial NOT NULL,
	"action" varchar(255),
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"amount" varchar(50),
	"status" varchar(50),
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trendingHashtags" (
	"id" serial PRIMARY KEY NOT NULL,
	"hashtag" text NOT NULL,
	"usageCount" integer DEFAULT 1,
	"trendingScore" numeric(10, 2) DEFAULT '0',
	"isActive" boolean DEFAULT true,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	CONSTRAINT "trendingHashtags_hashtag_unique" UNIQUE("hashtag")
);
--> statement-breakpoint
CREATE TABLE "trendingOutfitNotifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"outfitId" integer NOT NULL,
	"userId" integer NOT NULL,
	"trendingRank" integer,
	"engagementScore" integer,
	"isNotified" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tryOnAnalytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"try_on_id" integer,
	"success" boolean,
	"duration" integer,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tryOnResults" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" serial NOT NULL,
	"garmentId" serial NOT NULL,
	"image_url" varchar(500) NOT NULL,
	"watermarked_image_url" varchar(500),
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "userMonthlyUsage" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"month" date,
	"usage_count" integer,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "userCredits" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" serial NOT NULL,
	"credits" numeric(10, 2) DEFAULT '0' NOT NULL,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "userFollows" (
	"id" serial PRIMARY KEY NOT NULL,
	"followerId" integer NOT NULL,
	"followingId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "userMentions" (
	"id" serial PRIMARY KEY NOT NULL,
	"commentId" integer NOT NULL,
	"mentionedUserId" integer NOT NULL,
	"mentionedBy" integer NOT NULL,
	"isNotified" boolean DEFAULT false,
	"createdAt" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "userProfiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"bio" text,
	"avatar" text,
	"website" text,
	"location" text,
	"favoriteStyle" text,
	"followerCount" integer DEFAULT 0,
	"followingCount" integer DEFAULT 0,
	"outfitCount" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	CONSTRAINT "userProfiles_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"loginMethod" varchar(50) DEFAULT 'oauth' NOT NULL,
	"user_role" varchar(50) DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp,
	"phone" varchar(20),
	"user_type" varchar(50) DEFAULT 'individual',
	"currentBoutiqueId" integer,
	"freeTrialUsed" boolean DEFAULT false,
	"freeTrialUsedAt" timestamp,
	"freeTrialExpiresAt" timestamp,
	CONSTRAINT "users_openId_unique" UNIQUE("openId"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "webhookAlerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"webhook_event_id" integer,
	"alert_message" text,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhookEvents" (
	"id" serial PRIMARY KEY NOT NULL,
	"source" varchar(255),
	"eventType" varchar(255),
	"externalEventId" varchar(255),
	"payload" text,
	"webhook_event_status" varchar(50),
	"retryCount" integer DEFAULT 0,
	"maxRetries" integer DEFAULT 3,
	"lastRetryAt" timestamp,
	"nextRetryAt" timestamp,
	"error" text,
	"processedAt" timestamp,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "widgetAnalytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"widget_id" integer,
	"views" integer,
	"clicks" integer,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "widgets" (
	"id" serial PRIMARY KEY NOT NULL,
	"boutique_id" integer,
	"name" varchar(255),
	"config" text,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "affiliateCommissions" ADD CONSTRAINT "affiliateCommissions_affiliateTrackingId_affiliateTracking_id_fk" FOREIGN KEY ("affiliateTrackingId") REFERENCES "public"."affiliateTracking"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliateCommissions" ADD CONSTRAINT "affiliateCommissions_affiliateLinkId_affiliateLinks_id_fk" FOREIGN KEY ("affiliateLinkId") REFERENCES "public"."affiliateLinks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliateCommissions" ADD CONSTRAINT "affiliateCommissions_boutiqueId_boutiques_id_fk" FOREIGN KEY ("boutiqueId") REFERENCES "public"."boutiques"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliateTracking" ADD CONSTRAINT "affiliateTracking_affiliateLinkId_affiliateLinks_id_fk" FOREIGN KEY ("affiliateLinkId") REFERENCES "public"."affiliateLinks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliateTracking" ADD CONSTRAINT "affiliateTracking_boutiqueId_boutiques_id_fk" FOREIGN KEY ("boutiqueId") REFERENCES "public"."boutiques"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boutiqueCredits" ADD CONSTRAINT "boutiqueCredits_boutiqueId_boutiques_id_fk" FOREIGN KEY ("boutiqueId") REFERENCES "public"."boutiques"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boutiqueSettings" ADD CONSTRAINT "boutiqueSettings_boutiqueId_boutiques_id_fk" FOREIGN KEY ("boutiqueId") REFERENCES "public"."boutiques"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boutiqueSubscriptions" ADD CONSTRAINT "boutiqueSubscriptions_boutiqueId_boutiques_id_fk" FOREIGN KEY ("boutiqueId") REFERENCES "public"."boutiques"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boutiqueTransactions" ADD CONSTRAINT "boutiqueTransactions_boutiqueId_boutiques_id_fk" FOREIGN KEY ("boutiqueId") REFERENCES "public"."boutiques"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boutiqueUsers" ADD CONSTRAINT "boutiqueUsers_boutiqueId_boutiques_id_fk" FOREIGN KEY ("boutiqueId") REFERENCES "public"."boutiques"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boutiqueUsers" ADD CONSTRAINT "boutiqueUsers_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boutiques" ADD CONSTRAINT "boutiques_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commentNotifications" ADD CONSTRAINT "commentNotifications_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commentNotifications" ADD CONSTRAINT "commentNotifications_commentId_outfitComments_id_fk" FOREIGN KEY ("commentId") REFERENCES "public"."outfitComments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commentNotifications" ADD CONSTRAINT "commentNotifications_outfitId_savedOutfits_id_fk" FOREIGN KEY ("outfitId") REFERENCES "public"."savedOutfits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couponRedemptions" ADD CONSTRAINT "couponRedemptions_couponId_couponCodes_id_fk" FOREIGN KEY ("couponId") REFERENCES "public"."couponCodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "couponRedemptions" ADD CONSTRAINT "couponRedemptions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flaggedComments" ADD CONSTRAINT "flaggedComments_commentId_outfitComments_id_fk" FOREIGN KEY ("commentId") REFERENCES "public"."outfitComments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flaggedComments" ADD CONSTRAINT "flaggedComments_reportedBy_users_id_fk" FOREIGN KEY ("reportedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flaggedComments" ADD CONSTRAINT "flaggedComments_moderatedBy_users_id_fk" FOREIGN KEY ("moderatedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "followNotifications" ADD CONSTRAINT "followNotifications_followerId_users_id_fk" FOREIGN KEY ("followerId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "followNotifications" ADD CONSTRAINT "followNotifications_followingId_users_id_fk" FOREIGN KEY ("followingId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "garments" ADD CONSTRAINT "garments_boutiqueId_boutiques_id_fk" FOREIGN KEY ("boutiqueId") REFERENCES "public"."boutiques"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hashtagUsage" ADD CONSTRAINT "hashtagUsage_hashtagId_trendingHashtags_id_fk" FOREIGN KEY ("hashtagId") REFERENCES "public"."trendingHashtags"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hashtagUsage" ADD CONSTRAINT "hashtagUsage_outfitId_savedOutfits_id_fk" FOREIGN KEY ("outfitId") REFERENCES "public"."savedOutfits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentionNotifications" ADD CONSTRAINT "mentionNotifications_mentionedUserId_users_id_fk" FOREIGN KEY ("mentionedUserId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentionNotifications" ADD CONSTRAINT "mentionNotifications_mentionedByUserId_users_id_fk" FOREIGN KEY ("mentionedByUserId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderationLogs" ADD CONSTRAINT "moderationLogs_moderatorId_users_id_fk" FOREIGN KEY ("moderatorId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pollVoteNotifications" ADD CONSTRAINT "pollVoteNotifications_pollId_outfitVotings_id_fk" FOREIGN KEY ("pollId") REFERENCES "public"."outfitVotings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pollVoteNotifications" ADD CONSTRAINT "pollVoteNotifications_voterId_users_id_fk" FOREIGN KEY ("voterId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pollVoteNotifications" ADD CONSTRAINT "pollVoteNotifications_pollOwnerId_users_id_fk" FOREIGN KEY ("pollOwnerId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_boutiqueId_boutiques_id_fk" FOREIGN KEY ("boutiqueId") REFERENCES "public"."boutiques"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pushNotificationPreferences" ADD CONSTRAINT "pushNotificationPreferences_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pushNotifications" ADD CONSTRAINT "pushNotifications_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pushNotifications" ADD CONSTRAINT "pushNotifications_relatedUserId_users_id_fk" FOREIGN KEY ("relatedUserId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pushNotifications" ADD CONSTRAINT "pushNotifications_relatedOutfitId_savedOutfits_id_fk" FOREIGN KEY ("relatedOutfitId") REFERENCES "public"."savedOutfits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pushNotifications" ADD CONSTRAINT "pushNotifications_relatedPollId_outfitVotings_id_fk" FOREIGN KEY ("relatedPollId") REFERENCES "public"."outfitVotings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referralLinks" ADD CONSTRAINT "referralLinks_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referralLinks" ADD CONSTRAINT "referralLinks_outfitId_savedOutfits_id_fk" FOREIGN KEY ("outfitId") REFERENCES "public"."savedOutfits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referralTracking" ADD CONSTRAINT "referralTracking_referralLinkId_referralLinks_id_fk" FOREIGN KEY ("referralLinkId") REFERENCES "public"."referralLinks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referralTracking" ADD CONSTRAINT "referralTracking_referredUserId_users_id_fk" FOREIGN KEY ("referredUserId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referralTracking" ADD CONSTRAINT "referralTracking_referrerUserId_users_id_fk" FOREIGN KEY ("referrerUserId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savedOutfits" ADD CONSTRAINT "savedOutfits_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savedOutfits" ADD CONSTRAINT "savedOutfits_tryOnResultId_tryOnResults_id_fk" FOREIGN KEY ("tryOnResultId") REFERENCES "public"."tryOnResults"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trendingOutfitNotifications" ADD CONSTRAINT "trendingOutfitNotifications_outfitId_savedOutfits_id_fk" FOREIGN KEY ("outfitId") REFERENCES "public"."savedOutfits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trendingOutfitNotifications" ADD CONSTRAINT "trendingOutfitNotifications_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tryOnResults" ADD CONSTRAINT "tryOnResults_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tryOnResults" ADD CONSTRAINT "tryOnResults_garmentId_garments_id_fk" FOREIGN KEY ("garmentId") REFERENCES "public"."garments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userMonthlyUsage" ADD CONSTRAINT "userMonthlyUsage_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userCredits" ADD CONSTRAINT "userCredits_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userFollows" ADD CONSTRAINT "userFollows_followerId_users_id_fk" FOREIGN KEY ("followerId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userFollows" ADD CONSTRAINT "userFollows_followingId_users_id_fk" FOREIGN KEY ("followingId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userMentions" ADD CONSTRAINT "userMentions_commentId_outfitComments_id_fk" FOREIGN KEY ("commentId") REFERENCES "public"."outfitComments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userMentions" ADD CONSTRAINT "userMentions_mentionedUserId_users_id_fk" FOREIGN KEY ("mentionedUserId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userMentions" ADD CONSTRAINT "userMentions_mentionedBy_users_id_fk" FOREIGN KEY ("mentionedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userProfiles" ADD CONSTRAINT "userProfiles_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_commission_affiliate" ON "affiliateCommissions" USING btree ("affiliateLinkId");--> statement-breakpoint
CREATE INDEX "idx_commission_boutique" ON "affiliateCommissions" USING btree ("boutiqueId");--> statement-breakpoint
CREATE INDEX "idx_commission_status" ON "affiliateCommissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_commission_tracking" ON "affiliateCommissions" USING btree ("affiliateTrackingId");--> statement-breakpoint
CREATE INDEX "idx_affiliate_code" ON "affiliateLinks" USING btree ("affiliateCode");--> statement-breakpoint
CREATE INDEX "idx_affiliate_active" ON "affiliateLinks" USING btree ("isActive");--> statement-breakpoint
CREATE INDEX "idx_affiliate_tracking_link" ON "affiliateTracking" USING btree ("affiliateLinkId");--> statement-breakpoint
CREATE INDEX "idx_affiliate_tracking_boutique" ON "affiliateTracking" USING btree ("boutiqueId");--> statement-breakpoint
CREATE INDEX "idx_affiliate_tracking_token" ON "affiliateTracking" USING btree ("trackingToken");--> statement-breakpoint
CREATE INDEX "idx_affiliate_tracking_converted" ON "affiliateTracking" USING btree ("isConverted");--> statement-breakpoint
CREATE INDEX "idx_app_registrations_email" ON "appRegistrations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_app_registrations_apiKey" ON "appRegistrations" USING btree ("apiKey");--> statement-breakpoint
CREATE INDEX "idx_app_registrations_status" ON "appRegistrations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_boutique_credits_boutique" ON "boutiqueCredits" USING btree ("boutiqueId");--> statement-breakpoint
CREATE INDEX "idx_boutique_settings_boutique" ON "boutiqueSettings" USING btree ("boutiqueId");--> statement-breakpoint
CREATE INDEX "idx_boutique_settings_key" ON "boutiqueSettings" USING btree ("setting_key");--> statement-breakpoint
CREATE INDEX "idx_boutique_subscriptions_boutique" ON "boutiqueSubscriptions" USING btree ("boutiqueId");--> statement-breakpoint
CREATE INDEX "idx_boutique_transactions_boutique" ON "boutiqueTransactions" USING btree ("boutiqueId");--> statement-breakpoint
CREATE INDEX "idx_boutique_users_boutique" ON "boutiqueUsers" USING btree ("boutiqueId");--> statement-breakpoint
CREATE INDEX "idx_boutique_users_user" ON "boutiqueUsers" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_boutiques_owner" ON "boutiques" USING btree ("ownerId");--> statement-breakpoint
CREATE INDEX "idx_boutiques_slug" ON "boutiques" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_coupon_codes_code" ON "couponCodes" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_coupon_codes_active" ON "couponCodes" USING btree ("isActive");--> statement-breakpoint
CREATE INDEX "idx_coupon_redemptions_coupon" ON "couponRedemptions" USING btree ("couponId");--> statement-breakpoint
CREATE INDEX "idx_coupon_redemptions_user" ON "couponRedemptions" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_coupon_redemptions_unique" ON "couponRedemptions" USING btree ("couponId","userId");--> statement-breakpoint
CREATE INDEX "idx_followNotifications_followingId" ON "followNotifications" USING btree ("followingId");--> statement-breakpoint
CREATE INDEX "idx_followNotifications_followerId" ON "followNotifications" USING btree ("followerId");--> statement-breakpoint
CREATE INDEX "idx_garments_boutique" ON "garments" USING btree ("boutiqueId");--> statement-breakpoint
CREATE INDEX "idx_mentionNotifications_mentionedUserId" ON "mentionNotifications" USING btree ("mentionedUserId");--> statement-breakpoint
CREATE INDEX "idx_mentionNotifications_mentionedByUserId" ON "mentionNotifications" USING btree ("mentionedByUserId");--> statement-breakpoint
CREATE INDEX "idx_pollVoteNotifications_pollId" ON "pollVoteNotifications" USING btree ("pollId");--> statement-breakpoint
CREATE INDEX "idx_pollVoteNotifications_pollOwnerId" ON "pollVoteNotifications" USING btree ("pollOwnerId");--> statement-breakpoint
CREATE INDEX "idx_products_boutique" ON "products" USING btree ("boutiqueId");--> statement-breakpoint
CREATE INDEX "idx_pushNotificationPreferences_userId" ON "pushNotificationPreferences" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_pushNotifications_userId" ON "pushNotifications" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_pushNotifications_notificationType" ON "pushNotifications" USING btree ("notificationType");--> statement-breakpoint
CREATE INDEX "idx_pushNotifications_isRead" ON "pushNotifications" USING btree ("isRead");--> statement-breakpoint
CREATE INDEX "idx_pushNotifications_createdAt" ON "pushNotifications" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "idx_referral_code" ON "referralLinks" USING btree ("referralCode");--> statement-breakpoint
CREATE INDEX "idx_referral_user" ON "referralLinks" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_referral_outfit" ON "referralLinks" USING btree ("outfitId");--> statement-breakpoint
CREATE INDEX "idx_tracking_link" ON "referralTracking" USING btree ("referralLinkId");--> statement-breakpoint
CREATE INDEX "idx_tracking_referred" ON "referralTracking" USING btree ("referredUserId");--> statement-breakpoint
CREATE INDEX "idx_tracking_referrer" ON "referralTracking" USING btree ("referrerUserId");--> statement-breakpoint
CREATE INDEX "idx_saved_outfits_user" ON "savedOutfits" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_saved_outfits_tryon" ON "savedOutfits" USING btree ("tryOnResultId");--> statement-breakpoint
CREATE INDEX "idx_saved_outfits_created" ON "savedOutfits" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "idx_saved_outfits_favorite" ON "savedOutfits" USING btree ("isFavorite");--> statement-breakpoint
CREATE INDEX "idx_trendingOutfitNotifications_userId" ON "trendingOutfitNotifications" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_trendingOutfitNotifications_outfitId" ON "trendingOutfitNotifications" USING btree ("outfitId");--> statement-breakpoint
CREATE INDEX "idx_try_on_results_user" ON "tryOnResults" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_try_on_results_garment" ON "tryOnResults" USING btree ("garmentId");--> statement-breakpoint
CREATE INDEX "idx_user_credits_user" ON "userCredits" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_openId" ON "users" USING btree ("openId");