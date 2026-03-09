CREATE TYPE "public"."api_key_status" AS ENUM('active', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."audit_logs_action" AS ENUM('create', 'update', 'delete', 'export', 'import');--> statement-breakpoint
CREATE TYPE "public"."bank_account_type" AS ENUM('checking', 'savings');--> statement-breakpoint
CREATE TYPE "public"."batch_upload_file_status" AS ENUM('pending', 'uploaded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."batch_upload_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."boutique_status" AS ENUM('active', 'suspended', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."boutique_transaction_status" AS ENUM('pending', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."boutique_transaction_type" AS ENUM('purchase', 'usage', 'refund', 'adjustment');--> statement-breakpoint
CREATE TYPE "public"."boutique_user_role" AS ENUM('owner', 'manager', 'staff');--> statement-breakpoint
CREATE TYPE "public"."clothing_type" AS ENUM('upper', 'lower', 'combo', 'full');--> statement-breakpoint
CREATE TYPE "public"."email_notification_status" AS ENUM('pending', 'sent', 'failed', 'bounced');--> statement-breakpoint
CREATE TYPE "public"."email_notification_type" AS ENUM('purchase_confirmation', 'try_on_complete', 'credits_expiring', 'promotional');--> statement-breakpoint
CREATE TYPE "public"."fit_adjustment" AS ENUM('tight', 'perfect', 'loose');--> statement-breakpoint
CREATE TYPE "public"."flow_type" AS ENUM('b2c', 'b2b');--> statement-breakpoint
CREATE TYPE "public"."payment_reconciliation_status" AS ENUM('matched', 'unmatched', 'duplicate', 'mismatch');--> statement-breakpoint
CREATE TYPE "public"."payout_audit_actor_type" AS ENUM('system', 'admin', 'boutique');--> statement-breakpoint
CREATE TYPE "public"."payout_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."product_size" AS ENUM('XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL');--> statement-breakpoint
CREATE TYPE "public"."shop_order_status" AS ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('pending', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('purchase', 'usage', 'refund', 'adjustment', 'order_payment', 'order_confirmation');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin', 'merchant');--> statement-breakpoint
CREATE TYPE "public"."user_type" AS ENUM('customer', 'merchant', 'admin');--> statement-breakpoint
CREATE TYPE "public"."webhook_alert_severity" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."webhook_alert_type" AS ENUM('webhook_failed', 'webhook_max_retries', 'payment_unmatched', 'payment_mismatch');--> statement-breakpoint
CREATE TYPE "public"."webhook_event_status" AS ENUM('pending', 'processing', 'success', 'failed', 'retrying');--> statement-breakpoint
CREATE TABLE "analyticsSnapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" varchar(50) NOT NULL,
	"successRate" serial NOT NULL,
	"totalTryOns" serial NOT NULL,
	"averageProcessingTime" serial NOT NULL,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "apiKeyLogs" (
	"id" serial PRIMARY KEY NOT NULL,
	"apiKeyId" serial NOT NULL,
	"method" varchar(10) NOT NULL,
	"endpoint" varchar(500) NOT NULL,
	"statusCode" serial NOT NULL,
	"responseTime" serial NOT NULL,
	"ipAddress" varchar(45),
	"userAgent" text,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "apiKeys" (
	"id" serial PRIMARY KEY NOT NULL,
	"boutiqueId" serial NOT NULL,
	"name" varchar(255) NOT NULL,
	"key" varchar(255) NOT NULL,
	"maskedKey" varchar(50) NOT NULL,
	"api_key_status" "api_key_status" DEFAULT 'active' NOT NULL,
	"requestsCount" serial DEFAULT 0 NOT NULL,
	"lastUsedAt" timestamp,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"revokedAt" timestamp,
	CONSTRAINT "apiKeys_key_unique" UNIQUE("key"),
	CONSTRAINT "idx_api_keys_key" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "auditLogs" (
	"id" serial PRIMARY KEY NOT NULL,
	"boutiqueId" serial NOT NULL,
	"userId" serial NOT NULL,
	"action" varchar(255) NOT NULL,
	"entityType" varchar(100),
	"entityId" serial NOT NULL,
	"changes" text,
	"ipAddress" varchar(45),
	"userAgent" text,
	"status" varchar(50),
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "batchUploadFiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"batchUploadId" serial NOT NULL,
	"fileName" varchar(255) NOT NULL,
	"fileSize" serial NOT NULL,
	"fileUrl" text NOT NULL,
	"clothing_type" "clothing_type" NOT NULL,
	"batch_upload_file_status" "batch_upload_file_status" DEFAULT 'pending' NOT NULL,
	"errorMessage" text,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "batchUploads" (
	"id" serial PRIMARY KEY NOT NULL,
	"boutiqueId" serial NOT NULL,
	"userId" serial NOT NULL,
	"uploadName" varchar(255) NOT NULL,
	"totalFiles" serial DEFAULT 0 NOT NULL,
	"successfulFiles" serial DEFAULT 0 NOT NULL,
	"failedFiles" serial DEFAULT 0 NOT NULL,
	"batch_upload_status" "batch_upload_status" DEFAULT 'pending' NOT NULL,
	"errorMessage" text,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"completedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "boutiqueBankAccounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"boutiqueId" serial NOT NULL,
	"accountHolderName" varchar(255) NOT NULL,
	"bankName" varchar(255) NOT NULL,
	"accountNumber" varchar(50) NOT NULL,
	"branchCode" varchar(20),
	"bank_account_type" "bank_account_type" DEFAULT 'checking' NOT NULL,
	"isVerified" serial DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "boutiqueBankAccounts_boutiqueId_unique" UNIQUE("boutiqueId")
);
--> statement-breakpoint
CREATE TABLE "boutiqueCredits" (
	"id" serial PRIMARY KEY NOT NULL,
	"boutiqueId" serial NOT NULL,
	"totalCredits" serial DEFAULT 0 NOT NULL,
	"usedCredits" serial DEFAULT 0 NOT NULL,
	"remainingCredits" serial DEFAULT 0 NOT NULL,
	"expiresAt" timestamp,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "boutiqueCredits_boutiqueId_unique" UNIQUE("boutiqueId")
);
--> statement-breakpoint
CREATE TABLE "boutiqueSettings" (
	"id" serial PRIMARY KEY NOT NULL,
	"boutiqueId" serial NOT NULL,
	"brandingColor" varchar(7) DEFAULT '#FF6B35',
	"customDomain" varchar(255) DEFAULT '',
	"enableSharing" serial DEFAULT 1 NOT NULL,
	"enableAnalytics" serial DEFAULT 1 NOT NULL,
	"webhookUrl" varchar(500) DEFAULT '',
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "boutiqueSettings_boutiqueId_unique" UNIQUE("boutiqueId")
);
--> statement-breakpoint
CREATE TABLE "boutiqueTransactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"boutiqueId" serial NOT NULL,
	"boutique_transaction_type" "boutique_transaction_type" NOT NULL,
	"amount" serial NOT NULL,
	"price" numeric(10, 2),
	"currency" varchar(3) DEFAULT 'ZAR',
	"productId" serial NOT NULL,
	"fitRoomRequestId" varchar(255),
	"initiatedBy" serial NOT NULL,
	"description" text,
	"boutique_transaction_status" "boutique_transaction_status" DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "boutiqueUsers" (
	"id" serial PRIMARY KEY NOT NULL,
	"boutiqueId" serial NOT NULL,
	"userId" serial NOT NULL,
	"boutique_user_role" "boutique_user_role" DEFAULT 'staff' NOT NULL,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "boutiques" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"description" text,
	"logoUrl" varchar(500),
	"websiteUrl" varchar(500),
	"ownerId" serial NOT NULL,
	"boutique_status" "boutique_status" DEFAULT 'active' NOT NULL,
	"isVerified" serial DEFAULT 0 NOT NULL,
	"verificationToken" varchar(255),
	"verificationTokenExpiry" timestamp,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"instagramHandle" varchar(255),
	"tiktokHandle" varchar(255),
	"facebookUrl" varchar(500),
	"whatsappNumber" varchar(20),
	CONSTRAINT "boutiques_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "deletionLogs" (
	"id" serial PRIMARY KEY NOT NULL,
	"boutiqueId" serial NOT NULL,
	"userId" serial NOT NULL,
	"dataType" varchar(100) NOT NULL,
	"dataId" serial NOT NULL,
	"reason" varchar(255),
	"deletedBy" serial NOT NULL,
	"deletionHash" varchar(255),
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emailNotifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" serial NOT NULL,
	"email_notification_type" "email_notification_type" NOT NULL,
	"subject" varchar(255) NOT NULL,
	"recipientEmail" varchar(320) NOT NULL,
	"email_notification_status" "email_notification_status" DEFAULT 'pending' NOT NULL,
	"sentAt" timestamp,
	"failureReason" text,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" serial NOT NULL,
	"garmentId" serial NOT NULL,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "garments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100) NOT NULL,
	"imageUrl" varchar(500) NOT NULL,
	"price" varchar(20),
	"currency" varchar(3) DEFAULT 'ZAR',
	"isActive" serial DEFAULT 1 NOT NULL,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "paymentReconciliation" (
	"id" serial PRIMARY KEY NOT NULL,
	"yocoTransactionId" varchar(255) NOT NULL,
	"yocoAmount" numeric(10, 2) NOT NULL,
	"yocoCurrency" varchar(3) DEFAULT 'ZAR' NOT NULL,
	"yocoStatus" varchar(50) NOT NULL,
	"yocoTimestamp" timestamp NOT NULL,
	"styleswapUserId" serial NOT NULL,
	"styleswapTransactionId" serial NOT NULL,
	"styleswapCreditsAdded" serial NOT NULL,
	"styleswapTimestamp" timestamp,
	"payment_reconciliation_status" "payment_reconciliation_status" DEFAULT 'unmatched' NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "paymentReconciliation_yocoTransactionId_unique" UNIQUE("yocoTransactionId")
);
--> statement-breakpoint
CREATE TABLE "payoutAuditLog" (
	"id" serial PRIMARY KEY NOT NULL,
	"payoutId" serial NOT NULL,
	"action" varchar(100) NOT NULL,
	"oldStatus" varchar(50),
	"newStatus" varchar(50),
	"actorId" serial NOT NULL,
	"payout_audit_actor_type" "payout_audit_actor_type" DEFAULT 'system' NOT NULL,
	"details" text,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payoutTransactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"payoutId" serial NOT NULL,
	"orderId" serial NOT NULL,
	"orderAmount" numeric(10, 2) NOT NULL,
	"yokoFee" numeric(10, 2) NOT NULL,
	"boutiqueShare" numeric(10, 2) NOT NULL,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payouts" (
	"id" serial PRIMARY KEY NOT NULL,
	"boutiqueId" serial NOT NULL,
	"payoutPeriodStart" varchar(10) NOT NULL,
	"payoutPeriodEnd" varchar(10) NOT NULL,
	"totalRevenue" numeric(10, 2) DEFAULT '0' NOT NULL,
	"yokoFees" numeric(10, 2) DEFAULT '0' NOT NULL,
	"boutiquePayout" numeric(10, 2) DEFAULT '0' NOT NULL,
	"payout_status" "payout_status" DEFAULT 'pending' NOT NULL,
	"payoutDate" timestamp,
	"referenceNumber" varchar(100),
	"notes" text,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payouts_referenceNumber_unique" UNIQUE("referenceNumber")
);
--> statement-breakpoint
CREATE TABLE "productSizeVariants" (
	"id" serial PRIMARY KEY NOT NULL,
	"productId" serial NOT NULL,
	"product_size" "product_size" NOT NULL,
	"stock" serial DEFAULT 0 NOT NULL,
	"isAvailable" serial DEFAULT 1 NOT NULL,
	"fit_adjustment" "fit_adjustment" DEFAULT 'perfect' NOT NULL,
	"sizeScalingFactor" numeric(3, 2) DEFAULT '1.00' NOT NULL,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"boutiqueId" serial NOT NULL,
	"name" varchar(255) NOT NULL,
	"sku" varchar(100),
	"description" text,
	"category" varchar(100) NOT NULL,
	"imageUrl" varchar(500) NOT NULL,
	"price" numeric(10, 2),
	"currency" varchar(3) DEFAULT 'ZAR',
	"isActive" serial DEFAULT 1 NOT NULL,
	"hasSizeVariants" serial DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" serial NOT NULL,
	"tryOnResultId" serial NOT NULL,
	"rating" serial NOT NULL,
	"comment" text,
	"helpful" serial DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
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
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shopOrders" (
	"id" serial PRIMARY KEY NOT NULL,
	"orderNumber" varchar(50) NOT NULL,
	"customerId" serial NOT NULL,
	"boutiqueId" serial NOT NULL,
	"productId" serial NOT NULL,
	"quantity" serial DEFAULT 1 NOT NULL,
	"size" varchar(50),
	"color" varchar(50),
	"amount" numeric(10, 2) NOT NULL,
	"shop_order_status" "shop_order_status" DEFAULT 'pending' NOT NULL,
	"deliveryAddress" text,
	"customerPhone" varchar(20),
	"notes" text,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shopOrders_orderNumber_unique" UNIQUE("orderNumber"),
	CONSTRAINT "idx_shopOrders_number" UNIQUE("orderNumber")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" serial NOT NULL,
	"transaction_type" "transaction_type" NOT NULL,
	"amount" serial NOT NULL,
	"price" numeric(10, 2),
	"currency" varchar(3) DEFAULT 'ZAR',
	"fitRoomOrderId" varchar(255),
	"description" text,
	"transaction_status" "transaction_status" DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tryOnAnalytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"tryOnResultId" serial NOT NULL,
	"successRate" serial NOT NULL,
	"processingTime" serial NOT NULL,
	"imageQuality" varchar(50),
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tryOnResults" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" serial NOT NULL,
	"garmentId" serial NOT NULL,
	"userPhotoUrl" varchar(500) NOT NULL,
	"resultImageUrl" varchar(500),
	"shareToken" varchar(255),
	"shareCount" serial DEFAULT 0 NOT NULL,
	"isPublic" serial DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"boutiqueId" serial NOT NULL,
	"productId" serial NOT NULL,
	"fitRoomTaskId" varchar(255),
	"fitRoomRequestId" varchar(255),
	"flow_type" "flow_type" DEFAULT 'b2c' NOT NULL,
	"product_size" "product_size" DEFAULT 'M',
	"sizeScalingFactor" numeric(3, 2) DEFAULT '1.00',
	CONSTRAINT "tryOnResults_shareToken_unique" UNIQUE("shareToken")
);
--> statement-breakpoint
CREATE TABLE "userCredits" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" serial NOT NULL,
	"totalCredits" serial DEFAULT 0 NOT NULL,
	"usedCredits" serial DEFAULT 0 NOT NULL,
	"remainingCredits" serial DEFAULT 0 NOT NULL,
	"expiresAt" timestamp,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64),
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"user_role" "user_role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"phone" varchar(20),
	"user_type" "user_type" DEFAULT 'customer' NOT NULL,
	"currentBoutiqueId" serial NOT NULL,
	"freeTrialUsed" serial DEFAULT 0 NOT NULL,
	"freeTrialUsedAt" timestamp,
	"freeTrialExpiresAt" timestamp,
	CONSTRAINT "users_openId_unique" UNIQUE("openId"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "webhookAlerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"webhook_alert_type" "webhook_alert_type" NOT NULL,
	"webhook_alert_severity" "webhook_alert_severity" DEFAULT 'medium' NOT NULL,
	"webhookEventId" serial NOT NULL,
	"paymentReconciliationId" serial NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"isResolved" serial DEFAULT 0 NOT NULL,
	"resolvedAt" timestamp,
	"resolvedBy" serial NOT NULL,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhookEvents" (
	"id" serial PRIMARY KEY NOT NULL,
	"source" varchar(50) NOT NULL,
	"eventType" varchar(100) NOT NULL,
	"externalEventId" varchar(255) NOT NULL,
	"payload" text NOT NULL,
	"webhook_event_status" "webhook_event_status" DEFAULT 'pending' NOT NULL,
	"retryCount" serial DEFAULT 0 NOT NULL,
	"maxRetries" serial DEFAULT 3 NOT NULL,
	"lastRetryAt" timestamp,
	"nextRetryAt" timestamp,
	"error" text,
	"processedAt" timestamp,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "webhookEvents_externalEventId_unique" UNIQUE("externalEventId")
);
--> statement-breakpoint
CREATE TABLE "widgetAnalytics" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"widgetId" varchar(255) NOT NULL,
	"eventType" varchar(50) NOT NULL,
	"data" text,
	"timestamp" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "widgets" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"boutiqueId" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"isActive" serial DEFAULT 1 NOT NULL,
	"primaryColor" varchar(7) DEFAULT '#FF6B35' NOT NULL,
	"accentColor" varchar(7) DEFAULT '#004E89' NOT NULL,
	"createdAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "apiKeyLogs" ADD CONSTRAINT "apiKeyLogs_apiKeyId_apiKeys_id_fk" FOREIGN KEY ("apiKeyId") REFERENCES "public"."apiKeys"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "apiKeys" ADD CONSTRAINT "apiKeys_boutiqueId_boutiques_id_fk" FOREIGN KEY ("boutiqueId") REFERENCES "public"."boutiques"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auditLogs" ADD CONSTRAINT "auditLogs_boutiqueId_boutiques_id_fk" FOREIGN KEY ("boutiqueId") REFERENCES "public"."boutiques"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auditLogs" ADD CONSTRAINT "auditLogs_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batchUploadFiles" ADD CONSTRAINT "batchUploadFiles_batchUploadId_batchUploads_id_fk" FOREIGN KEY ("batchUploadId") REFERENCES "public"."batchUploads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batchUploads" ADD CONSTRAINT "batchUploads_boutiqueId_boutiques_id_fk" FOREIGN KEY ("boutiqueId") REFERENCES "public"."boutiques"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "batchUploads" ADD CONSTRAINT "batchUploads_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boutiqueBankAccounts" ADD CONSTRAINT "boutiqueBankAccounts_boutiqueId_boutiques_id_fk" FOREIGN KEY ("boutiqueId") REFERENCES "public"."boutiques"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boutiqueCredits" ADD CONSTRAINT "boutiqueCredits_boutiqueId_boutiques_id_fk" FOREIGN KEY ("boutiqueId") REFERENCES "public"."boutiques"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boutiqueSettings" ADD CONSTRAINT "boutiqueSettings_boutiqueId_boutiques_id_fk" FOREIGN KEY ("boutiqueId") REFERENCES "public"."boutiques"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boutiqueTransactions" ADD CONSTRAINT "boutiqueTransactions_boutiqueId_boutiques_id_fk" FOREIGN KEY ("boutiqueId") REFERENCES "public"."boutiques"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boutiqueTransactions" ADD CONSTRAINT "boutiqueTransactions_initiatedBy_users_id_fk" FOREIGN KEY ("initiatedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boutiqueUsers" ADD CONSTRAINT "boutiqueUsers_boutiqueId_boutiques_id_fk" FOREIGN KEY ("boutiqueId") REFERENCES "public"."boutiques"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boutiqueUsers" ADD CONSTRAINT "boutiqueUsers_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boutiques" ADD CONSTRAINT "boutiques_ownerId_users_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deletionLogs" ADD CONSTRAINT "deletionLogs_boutiqueId_boutiques_id_fk" FOREIGN KEY ("boutiqueId") REFERENCES "public"."boutiques"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deletionLogs" ADD CONSTRAINT "deletionLogs_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deletionLogs" ADD CONSTRAINT "deletionLogs_deletedBy_users_id_fk" FOREIGN KEY ("deletedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emailNotifications" ADD CONSTRAINT "emailNotifications_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_garmentId_garments_id_fk" FOREIGN KEY ("garmentId") REFERENCES "public"."garments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paymentReconciliation" ADD CONSTRAINT "paymentReconciliation_styleswapUserId_users_id_fk" FOREIGN KEY ("styleswapUserId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "paymentReconciliation" ADD CONSTRAINT "paymentReconciliation_styleswapTransactionId_transactions_id_fk" FOREIGN KEY ("styleswapTransactionId") REFERENCES "public"."transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payoutAuditLog" ADD CONSTRAINT "payoutAuditLog_payoutId_payouts_id_fk" FOREIGN KEY ("payoutId") REFERENCES "public"."payouts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payoutTransactions" ADD CONSTRAINT "payoutTransactions_payoutId_payouts_id_fk" FOREIGN KEY ("payoutId") REFERENCES "public"."payouts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payoutTransactions" ADD CONSTRAINT "payoutTransactions_orderId_shopOrders_id_fk" FOREIGN KEY ("orderId") REFERENCES "public"."shopOrders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_boutiqueId_boutiques_id_fk" FOREIGN KEY ("boutiqueId") REFERENCES "public"."boutiques"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "productSizeVariants" ADD CONSTRAINT "productSizeVariants_productId_products_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_boutiqueId_boutiques_id_fk" FOREIGN KEY ("boutiqueId") REFERENCES "public"."boutiques"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_tryOnResultId_tryOnResults_id_fk" FOREIGN KEY ("tryOnResultId") REFERENCES "public"."tryOnResults"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savedOutfits" ADD CONSTRAINT "savedOutfits_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "savedOutfits" ADD CONSTRAINT "savedOutfits_tryOnResultId_tryOnResults_id_fk" FOREIGN KEY ("tryOnResultId") REFERENCES "public"."tryOnResults"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopOrders" ADD CONSTRAINT "shopOrders_customerId_users_id_fk" FOREIGN KEY ("customerId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shopOrders" ADD CONSTRAINT "shopOrders_boutiqueId_boutiques_id_fk" FOREIGN KEY ("boutiqueId") REFERENCES "public"."boutiques"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tryOnAnalytics" ADD CONSTRAINT "tryOnAnalytics_tryOnResultId_tryOnResults_id_fk" FOREIGN KEY ("tryOnResultId") REFERENCES "public"."tryOnResults"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tryOnResults" ADD CONSTRAINT "tryOnResults_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tryOnResults" ADD CONSTRAINT "tryOnResults_garmentId_garments_id_fk" FOREIGN KEY ("garmentId") REFERENCES "public"."garments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tryOnResults" ADD CONSTRAINT "tryOnResults_boutiqueId_boutiques_id_fk" FOREIGN KEY ("boutiqueId") REFERENCES "public"."boutiques"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tryOnResults" ADD CONSTRAINT "tryOnResults_productId_products_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userCredits" ADD CONSTRAINT "userCredits_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhookAlerts" ADD CONSTRAINT "webhookAlerts_webhookEventId_webhookEvents_id_fk" FOREIGN KEY ("webhookEventId") REFERENCES "public"."webhookEvents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhookAlerts" ADD CONSTRAINT "webhookAlerts_paymentReconciliationId_paymentReconciliation_id_fk" FOREIGN KEY ("paymentReconciliationId") REFERENCES "public"."paymentReconciliation"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhookAlerts" ADD CONSTRAINT "webhookAlerts_resolvedBy_users_id_fk" FOREIGN KEY ("resolvedBy") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "widgetAnalytics" ADD CONSTRAINT "widgetAnalytics_widgetId_widgets_id_fk" FOREIGN KEY ("widgetId") REFERENCES "public"."widgets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "widgets" ADD CONSTRAINT "widgets_boutiqueId_boutiques_id_fk" FOREIGN KEY ("boutiqueId") REFERENCES "public"."boutiques"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_analytics_snapshots_date" ON "analyticsSnapshots" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_analytics_snapshots_created" ON "analyticsSnapshots" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "idx_api_key_logs_key" ON "apiKeyLogs" USING btree ("apiKeyId");--> statement-breakpoint
CREATE INDEX "idx_api_key_logs_created" ON "apiKeyLogs" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "idx_api_key_logs_endpoint" ON "apiKeyLogs" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "idx_api_keys_boutique" ON "apiKeys" USING btree ("boutiqueId");--> statement-breakpoint
CREATE INDEX "idx_api_keys_status" ON "apiKeys" USING btree ("api_key_status");--> statement-breakpoint
CREATE INDEX "idx_api_keys_created" ON "apiKeys" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_boutique" ON "auditLogs" USING btree ("boutiqueId");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_user" ON "auditLogs" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_action" ON "auditLogs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_created" ON "auditLogs" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "idx_batch_files_batch" ON "batchUploadFiles" USING btree ("batchUploadId");--> statement-breakpoint
CREATE INDEX "idx_batch_files_status" ON "batchUploadFiles" USING btree ("batch_upload_file_status");--> statement-breakpoint
CREATE INDEX "idx_batch_files_created" ON "batchUploadFiles" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "idx_batch_uploads_boutique" ON "batchUploads" USING btree ("boutiqueId");--> statement-breakpoint
CREATE INDEX "idx_batch_uploads_user" ON "batchUploads" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_batch_uploads_status" ON "batchUploads" USING btree ("batch_upload_status");--> statement-breakpoint
CREATE INDEX "idx_batch_uploads_created" ON "batchUploads" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "idx_bank_accounts_boutique" ON "boutiqueBankAccounts" USING btree ("boutiqueId");--> statement-breakpoint
CREATE INDEX "idx_boutique_credits_boutique" ON "boutiqueCredits" USING btree ("boutiqueId");--> statement-breakpoint
CREATE INDEX "idx_boutique_transactions_boutique" ON "boutiqueTransactions" USING btree ("boutiqueId");--> statement-breakpoint
CREATE INDEX "idx_boutique_transactions_type" ON "boutiqueTransactions" USING btree ("boutique_transaction_type");--> statement-breakpoint
CREATE INDEX "idx_boutique_transactions_created" ON "boutiqueTransactions" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "idx_boutique_user_boutique" ON "boutiqueUsers" USING btree ("boutiqueId");--> statement-breakpoint
CREATE INDEX "idx_boutique_user_user" ON "boutiqueUsers" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_boutique_owner" ON "boutiques" USING btree ("ownerId");--> statement-breakpoint
CREATE INDEX "idx_boutique_status" ON "boutiques" USING btree ("boutique_status");--> statement-breakpoint
CREATE INDEX "idx_deletion_logs_boutique" ON "deletionLogs" USING btree ("boutiqueId");--> statement-breakpoint
CREATE INDEX "idx_deletion_logs_created" ON "deletionLogs" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "idx_email_notifications_user" ON "emailNotifications" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_favorites_user" ON "favorites" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_garments_active" ON "garments" USING btree ("isActive");--> statement-breakpoint
CREATE INDEX "idx_audit_log_payout" ON "payoutAuditLog" USING btree ("payoutId");--> statement-breakpoint
CREATE INDEX "idx_audit_log_created" ON "payoutAuditLog" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "idx_payout_transactions_payout" ON "payoutTransactions" USING btree ("payoutId");--> statement-breakpoint
CREATE INDEX "idx_payout_transactions_order" ON "payoutTransactions" USING btree ("orderId");--> statement-breakpoint
CREATE INDEX "idx_payouts_boutique_status" ON "payouts" USING btree ("boutiqueId","payout_status");--> statement-breakpoint
CREATE INDEX "idx_payouts_date" ON "payouts" USING btree ("payoutDate");--> statement-breakpoint
CREATE INDEX "idx_product_size_product" ON "productSizeVariants" USING btree ("productId");--> statement-breakpoint
CREATE INDEX "idx_product_size_available" ON "productSizeVariants" USING btree ("isAvailable");--> statement-breakpoint
CREATE INDEX "idx_products_boutique" ON "products" USING btree ("boutiqueId");--> statement-breakpoint
CREATE INDEX "idx_products_active" ON "products" USING btree ("isActive");--> statement-breakpoint
CREATE INDEX "idx_reviews_user" ON "reviews" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_reviews_try_on" ON "reviews" USING btree ("tryOnResultId");--> statement-breakpoint
CREATE INDEX "idx_reviews_rating" ON "reviews" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "idx_reviews_created" ON "reviews" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "idx_saved_outfits_user" ON "savedOutfits" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_saved_outfits_tryon" ON "savedOutfits" USING btree ("tryOnResultId");--> statement-breakpoint
CREATE INDEX "idx_saved_outfits_created" ON "savedOutfits" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "idx_saved_outfits_favorite" ON "savedOutfits" USING btree ("isFavorite");--> statement-breakpoint
CREATE INDEX "idx_shopOrders_customer" ON "shopOrders" USING btree ("customerId");--> statement-breakpoint
CREATE INDEX "idx_shopOrders_boutique" ON "shopOrders" USING btree ("boutiqueId");--> statement-breakpoint
CREATE INDEX "idx_shopOrders_status" ON "shopOrders" USING btree ("shop_order_status");--> statement-breakpoint
CREATE INDEX "idx_shopOrders_created" ON "shopOrders" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "idx_transactions_user" ON "transactions" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_transactions_type" ON "transactions" USING btree ("transaction_type");--> statement-breakpoint
CREATE INDEX "idx_try_on_analytics_result" ON "tryOnAnalytics" USING btree ("tryOnResultId");--> statement-breakpoint
CREATE INDEX "idx_try_on_analytics_created" ON "tryOnAnalytics" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "idx_tryon_boutique" ON "tryOnResults" USING btree ("boutiqueId");--> statement-breakpoint
CREATE INDEX "idx_tryon_user" ON "tryOnResults" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_tryon_flowtype" ON "tryOnResults" USING btree ("flow_type");--> statement-breakpoint
CREATE INDEX "idx_tryon_size" ON "tryOnResults" USING btree ("product_size");--> statement-breakpoint
CREATE INDEX "idx_user_credits_user" ON "userCredits" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "idx_widget_analytics_widget" ON "widgetAnalytics" USING btree ("widgetId");--> statement-breakpoint
CREATE INDEX "idx_widget_analytics_event" ON "widgetAnalytics" USING btree ("eventType");--> statement-breakpoint
CREATE INDEX "idx_widget_analytics_timestamp" ON "widgetAnalytics" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_widgets_boutique" ON "widgets" USING btree ("boutiqueId");--> statement-breakpoint
CREATE INDEX "idx_widgets_active" ON "widgets" USING btree ("isActive");--> statement-breakpoint
CREATE INDEX "idx_widgets_created" ON "widgets" USING btree ("createdAt");