CREATE TABLE `apiKeyLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`apiKeyId` int NOT NULL,
	`method` varchar(10) NOT NULL,
	`endpoint` varchar(500) NOT NULL,
	`statusCode` int NOT NULL,
	`responseTime` int,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	CONSTRAINT `apiKeyLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `apiKeys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`boutiqueId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`key` varchar(255) NOT NULL,
	`maskedKey` varchar(50) NOT NULL,
	`status` enum('active','revoked') NOT NULL DEFAULT 'active',
	`requestsCount` int NOT NULL DEFAULT 0,
	`lastUsedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`revokedAt` timestamp,
	CONSTRAINT `apiKeys_id` PRIMARY KEY(`id`),
	CONSTRAINT `apiKeys_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `boutiqueBankAccounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`boutiqueId` int NOT NULL,
	`accountHolderName` varchar(255) NOT NULL,
	`bankName` varchar(255) NOT NULL,
	`accountNumber` varchar(50) NOT NULL,
	`branchCode` varchar(20),
	`accountType` enum('checking','savings') NOT NULL DEFAULT 'checking',
	`isVerified` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `boutiqueBankAccounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `boutiqueBankAccounts_boutiqueId_unique` UNIQUE(`boutiqueId`)
);
--> statement-breakpoint
CREATE TABLE `payoutAuditLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`payoutId` int,
	`action` varchar(100) NOT NULL,
	`oldStatus` varchar(50),
	`newStatus` varchar(50),
	`actorId` int,
	`actorType` enum('system','admin','boutique') NOT NULL DEFAULT 'system',
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	CONSTRAINT `payoutAuditLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payoutTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`payoutId` int NOT NULL,
	`orderId` int NOT NULL,
	`orderAmount` decimal(10,2) NOT NULL,
	`yokoFee` decimal(10,2) NOT NULL,
	`boutiqueShare` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	CONSTRAINT `payoutTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payouts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`boutiqueId` int NOT NULL,
	`payoutPeriodStart` varchar(10) NOT NULL,
	`payoutPeriodEnd` varchar(10) NOT NULL,
	`totalRevenue` decimal(10,2) NOT NULL DEFAULT '0',
	`yokoFees` decimal(10,2) NOT NULL DEFAULT '0',
	`boutiquePayout` decimal(10,2) NOT NULL DEFAULT '0',
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`payoutDate` timestamp,
	`referenceNumber` varchar(100),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payouts_id` PRIMARY KEY(`id`),
	CONSTRAINT `payouts_referenceNumber_unique` UNIQUE(`referenceNumber`)
);
--> statement-breakpoint
CREATE TABLE `productSizeVariants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`size` enum('XS','S','M','L','XL','XXL','XXXL') NOT NULL,
	`stock` int NOT NULL DEFAULT 0,
	`isAvailable` int NOT NULL DEFAULT 1,
	`fitAdjustment` enum('tight','perfect','loose') NOT NULL DEFAULT 'perfect',
	`sizeScalingFactor` decimal(3,2) NOT NULL DEFAULT '1.00',
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `shopOrders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNumber` varchar(50) NOT NULL,
	`customerId` int NOT NULL,
	`boutiqueId` int NOT NULL,
	`productId` int,
	`quantity` int NOT NULL DEFAULT 1,
	`size` varchar(50),
	`color` varchar(50),
	`amount` decimal(10,2) NOT NULL,
	`status` enum('pending','confirmed','processing','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
	`deliveryAddress` text,
	`customerPhone` varchar(20),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shopOrders_id` PRIMARY KEY(`id`),
	CONSTRAINT `shopOrders_orderNumber_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
ALTER TABLE `paymentReconciliation` DROP INDEX `paymentReconciliation_yocoTransactionId_unique`;--> statement-breakpoint
ALTER TABLE `webhookEvents` DROP INDEX `webhookEvents_externalEventId_unique`;--> statement-breakpoint
ALTER TABLE `tryOnAnalytics` DROP FOREIGN KEY `tryOnAnalytics_userId_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `tryOnAnalytics` DROP FOREIGN KEY `tryOnAnalytics_boutiqueId_boutiques_id_fk`;
--> statement-breakpoint
DROP INDEX `idx_snapshot_date` ON `analyticsSnapshots`;--> statement-breakpoint
DROP INDEX `idx_snapshot_version` ON `analyticsSnapshots`;--> statement-breakpoint
DROP INDEX `idx_snapshot_flow` ON `analyticsSnapshots`;--> statement-breakpoint
DROP INDEX `idx_payment_yoco_id` ON `paymentReconciliation`;--> statement-breakpoint
DROP INDEX `idx_payment_status` ON `paymentReconciliation`;--> statement-breakpoint
DROP INDEX `idx_payment_user` ON `paymentReconciliation`;--> statement-breakpoint
DROP INDEX `idx_analytics_user` ON `tryOnAnalytics`;--> statement-breakpoint
DROP INDEX `idx_analytics_boutique` ON `tryOnAnalytics`;--> statement-breakpoint
DROP INDEX `idx_analytics_success` ON `tryOnAnalytics`;--> statement-breakpoint
DROP INDEX `idx_analytics_version` ON `tryOnAnalytics`;--> statement-breakpoint
DROP INDEX `idx_analytics_created` ON `tryOnAnalytics`;--> statement-breakpoint
DROP INDEX `idx_analytics_error` ON `tryOnAnalytics`;--> statement-breakpoint
DROP INDEX `idx_analytics_flow` ON `tryOnAnalytics`;--> statement-breakpoint
DROP INDEX `idx_alert_type` ON `webhookAlerts`;--> statement-breakpoint
DROP INDEX `idx_alert_severity` ON `webhookAlerts`;--> statement-breakpoint
DROP INDEX `idx_alert_resolved` ON `webhookAlerts`;--> statement-breakpoint
DROP INDEX `idx_webhook_status` ON `webhookEvents`;--> statement-breakpoint
DROP INDEX `idx_webhook_source` ON `webhookEvents`;--> statement-breakpoint
DROP INDEX `idx_webhook_external_id` ON `webhookEvents`;--> statement-breakpoint
ALTER TABLE `analyticsSnapshots` MODIFY COLUMN `successRate` int;--> statement-breakpoint
ALTER TABLE `paymentReconciliation` MODIFY COLUMN `yocoCurrency` varchar(3) NOT NULL DEFAULT 'ZAR';--> statement-breakpoint
ALTER TABLE `paymentReconciliation` MODIFY COLUMN `reconciliationStatus` enum('matched','unmatched','duplicate','mismatch') NOT NULL DEFAULT 'unmatched';--> statement-breakpoint
ALTER TABLE `paymentReconciliation` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `transactions` MODIFY COLUMN `type` enum('purchase','usage','refund','adjustment','order_payment','order_confirmation') NOT NULL;--> statement-breakpoint
ALTER TABLE `tryOnAnalytics` MODIFY COLUMN `tryOnResultId` int;--> statement-breakpoint
ALTER TABLE `webhookAlerts` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `webhookEvents` MODIFY COLUMN `source` varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE `webhookEvents` MODIFY COLUMN `payload` text NOT NULL;--> statement-breakpoint
ALTER TABLE `webhookEvents` MODIFY COLUMN `status` enum('pending','processing','success','failed','retrying') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `webhookEvents` MODIFY COLUMN `nextRetryAt` timestamp;--> statement-breakpoint
ALTER TABLE `webhookEvents` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `analyticsSnapshots` ADD `date` varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE `analyticsSnapshots` ADD `totalTryOns` int;--> statement-breakpoint
ALTER TABLE `analyticsSnapshots` ADD `averageProcessingTime` int;--> statement-breakpoint
ALTER TABLE `paymentReconciliation` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `products` ADD `hasSizeVariants` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `tryOnAnalytics` ADD `successRate` int;--> statement-breakpoint
ALTER TABLE `tryOnAnalytics` ADD `processingTime` int;--> statement-breakpoint
ALTER TABLE `tryOnAnalytics` ADD `imageQuality` varchar(50);--> statement-breakpoint
ALTER TABLE `tryOnResults` ADD `selectedSize` enum('XS','S','M','L','XL','XXL','XXXL');--> statement-breakpoint
ALTER TABLE `tryOnResults` ADD `sizeScalingFactor` decimal(3,2) DEFAULT '1.00';--> statement-breakpoint
ALTER TABLE `users` ADD `freeTrialUsed` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `freeTrialUsedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `freeTrialExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `apiKeyLogs` ADD CONSTRAINT `apiKeyLogs_apiKeyId_apiKeys_id_fk` FOREIGN KEY (`apiKeyId`) REFERENCES `apiKeys`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `apiKeys` ADD CONSTRAINT `apiKeys_boutiqueId_boutiques_id_fk` FOREIGN KEY (`boutiqueId`) REFERENCES `boutiques`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `boutiqueBankAccounts` ADD CONSTRAINT `boutiqueBankAccounts_boutiqueId_boutiques_id_fk` FOREIGN KEY (`boutiqueId`) REFERENCES `boutiques`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payoutAuditLog` ADD CONSTRAINT `payoutAuditLog_payoutId_payouts_id_fk` FOREIGN KEY (`payoutId`) REFERENCES `payouts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payoutTransactions` ADD CONSTRAINT `payoutTransactions_payoutId_payouts_id_fk` FOREIGN KEY (`payoutId`) REFERENCES `payouts`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payoutTransactions` ADD CONSTRAINT `payoutTransactions_orderId_shopOrders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `shopOrders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payouts` ADD CONSTRAINT `payouts_boutiqueId_boutiques_id_fk` FOREIGN KEY (`boutiqueId`) REFERENCES `boutiques`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `productSizeVariants` ADD CONSTRAINT `productSizeVariants_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shopOrders` ADD CONSTRAINT `shopOrders_customerId_users_id_fk` FOREIGN KEY (`customerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shopOrders` ADD CONSTRAINT `shopOrders_boutiqueId_boutiques_id_fk` FOREIGN KEY (`boutiqueId`) REFERENCES `boutiques`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_api_key_logs_key` ON `apiKeyLogs` (`apiKeyId`);--> statement-breakpoint
CREATE INDEX `idx_api_key_logs_created` ON `apiKeyLogs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_api_key_logs_endpoint` ON `apiKeyLogs` (`endpoint`);--> statement-breakpoint
CREATE INDEX `idx_api_keys_boutique` ON `apiKeys` (`boutiqueId`);--> statement-breakpoint
CREATE INDEX `idx_api_keys_key` ON `apiKeys` (`key`);--> statement-breakpoint
CREATE INDEX `idx_api_keys_status` ON `apiKeys` (`status`);--> statement-breakpoint
CREATE INDEX `idx_api_keys_created` ON `apiKeys` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_bank_accounts_boutique` ON `boutiqueBankAccounts` (`boutiqueId`);--> statement-breakpoint
CREATE INDEX `idx_audit_log_payout` ON `payoutAuditLog` (`payoutId`);--> statement-breakpoint
CREATE INDEX `idx_audit_log_created` ON `payoutAuditLog` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_payout_transactions_payout` ON `payoutTransactions` (`payoutId`);--> statement-breakpoint
CREATE INDEX `idx_payout_transactions_order` ON `payoutTransactions` (`orderId`);--> statement-breakpoint
CREATE INDEX `idx_payouts_boutique_status` ON `payouts` (`boutiqueId`,`status`);--> statement-breakpoint
CREATE INDEX `idx_payouts_date` ON `payouts` (`payoutDate`);--> statement-breakpoint
CREATE INDEX `idx_product_size_product` ON `productSizeVariants` (`productId`);--> statement-breakpoint
CREATE INDEX `idx_product_size_available` ON `productSizeVariants` (`isAvailable`);--> statement-breakpoint
CREATE INDEX `idx_shopOrders_customer` ON `shopOrders` (`customerId`);--> statement-breakpoint
CREATE INDEX `idx_shopOrders_boutique` ON `shopOrders` (`boutiqueId`);--> statement-breakpoint
CREATE INDEX `idx_shopOrders_status` ON `shopOrders` (`status`);--> statement-breakpoint
CREATE INDEX `idx_shopOrders_created` ON `shopOrders` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_shopOrders_number` ON `shopOrders` (`orderNumber`);--> statement-breakpoint
ALTER TABLE `paymentReconciliation` ADD CONSTRAINT `paymentReconciliation_styleswapUserId_users_id_fk` FOREIGN KEY (`styleswapUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `paymentReconciliation` ADD CONSTRAINT `paymentReconciliation_styleswapTransactionId_transactions_id_fk` FOREIGN KEY (`styleswapTransactionId`) REFERENCES `transactions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `webhookAlerts` ADD CONSTRAINT `webhookAlerts_webhookEventId_webhookEvents_id_fk` FOREIGN KEY (`webhookEventId`) REFERENCES `webhookEvents`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `webhookAlerts` ADD CONSTRAINT `webhookAlerts_paymentReconciliationId_paymentReconciliation_id_fk` FOREIGN KEY (`paymentReconciliationId`) REFERENCES `paymentReconciliation`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `webhookAlerts` ADD CONSTRAINT `webhookAlerts_resolvedBy_users_id_fk` FOREIGN KEY (`resolvedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_analytics_snapshots_date` ON `analyticsSnapshots` (`date`);--> statement-breakpoint
CREATE INDEX `idx_analytics_snapshots_created` ON `analyticsSnapshots` (`createdAt`);--> statement-breakpoint
CREATE INDEX `paymentReconciliation_yocoTransactionId_unique` ON `paymentReconciliation` (`yocoTransactionId`);--> statement-breakpoint
CREATE INDEX `idx_try_on_analytics_result` ON `tryOnAnalytics` (`tryOnResultId`);--> statement-breakpoint
CREATE INDEX `idx_try_on_analytics_created` ON `tryOnAnalytics` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_tryon_size` ON `tryOnResults` (`selectedSize`);--> statement-breakpoint
CREATE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE INDEX `webhookEvents_externalEventId_unique` ON `webhookEvents` (`externalEventId`);--> statement-breakpoint
ALTER TABLE `analyticsSnapshots` DROP COLUMN `snapshotDate`;--> statement-breakpoint
ALTER TABLE `analyticsSnapshots` DROP COLUMN `imageOptimizationVersion`;--> statement-breakpoint
ALTER TABLE `analyticsSnapshots` DROP COLUMN `flowType`;--> statement-breakpoint
ALTER TABLE `analyticsSnapshots` DROP COLUMN `totalAttempts`;--> statement-breakpoint
ALTER TABLE `analyticsSnapshots` DROP COLUMN `successfulAttempts`;--> statement-breakpoint
ALTER TABLE `analyticsSnapshots` DROP COLUMN `failedAttempts`;--> statement-breakpoint
ALTER TABLE `analyticsSnapshots` DROP COLUMN `avgProcessingTimeMs`;--> statement-breakpoint
ALTER TABLE `analyticsSnapshots` DROP COLUMN `p95ProcessingTimeMs`;--> statement-breakpoint
ALTER TABLE `analyticsSnapshots` DROP COLUMN `p99ProcessingTimeMs`;--> statement-breakpoint
ALTER TABLE `analyticsSnapshots` DROP COLUMN `avgUploadTimeMs`;--> statement-breakpoint
ALTER TABLE `analyticsSnapshots` DROP COLUMN `avgFitRoomResponseTimeMs`;--> statement-breakpoint
ALTER TABLE `analyticsSnapshots` DROP COLUMN `avgOriginalModelImageSize`;--> statement-breakpoint
ALTER TABLE `analyticsSnapshots` DROP COLUMN `avgOptimizedModelImageSize`;--> statement-breakpoint
ALTER TABLE `analyticsSnapshots` DROP COLUMN `avgOriginalClothImageSize`;--> statement-breakpoint
ALTER TABLE `analyticsSnapshots` DROP COLUMN `avgOptimizedClothImageSize`;--> statement-breakpoint
ALTER TABLE `analyticsSnapshots` DROP COLUMN `compressionRatio`;--> statement-breakpoint
ALTER TABLE `analyticsSnapshots` DROP COLUMN `topErrorType`;--> statement-breakpoint
ALTER TABLE `analyticsSnapshots` DROP COLUMN `errorTypeBreakdown`;--> statement-breakpoint
ALTER TABLE `analyticsSnapshots` DROP COLUMN `updatedAt`;--> statement-breakpoint
ALTER TABLE `tryOnAnalytics` DROP COLUMN `userId`;--> statement-breakpoint
ALTER TABLE `tryOnAnalytics` DROP COLUMN `boutiqueId`;--> statement-breakpoint
ALTER TABLE `tryOnAnalytics` DROP COLUMN `flowType`;--> statement-breakpoint
ALTER TABLE `tryOnAnalytics` DROP COLUMN `imageOptimizationVersion`;--> statement-breakpoint
ALTER TABLE `tryOnAnalytics` DROP COLUMN `originalModelImageWidth`;--> statement-breakpoint
ALTER TABLE `tryOnAnalytics` DROP COLUMN `originalModelImageHeight`;--> statement-breakpoint
ALTER TABLE `tryOnAnalytics` DROP COLUMN `originalModelImageSize`;--> statement-breakpoint
ALTER TABLE `tryOnAnalytics` DROP COLUMN `optimizedModelImageWidth`;--> statement-breakpoint
ALTER TABLE `tryOnAnalytics` DROP COLUMN `optimizedModelImageHeight`;--> statement-breakpoint
ALTER TABLE `tryOnAnalytics` DROP COLUMN `optimizedModelImageSize`;--> statement-breakpoint
ALTER TABLE `tryOnAnalytics` DROP COLUMN `originalClothImageWidth`;--> statement-breakpoint
ALTER TABLE `tryOnAnalytics` DROP COLUMN `originalClothImageHeight`;--> statement-breakpoint
ALTER TABLE `tryOnAnalytics` DROP COLUMN `originalClothImageSize`;--> statement-breakpoint
ALTER TABLE `tryOnAnalytics` DROP COLUMN `optimizedClothImageWidth`;--> statement-breakpoint
ALTER TABLE `tryOnAnalytics` DROP COLUMN `optimizedClothImageHeight`;--> statement-breakpoint
ALTER TABLE `tryOnAnalytics` DROP COLUMN `optimizedClothImageSize`;--> statement-breakpoint
ALTER TABLE `tryOnAnalytics` DROP COLUMN `success`;--> statement-breakpoint
ALTER TABLE `tryOnAnalytics` DROP COLUMN `processingTimeMs`;--> statement-breakpoint
ALTER TABLE `tryOnAnalytics` DROP COLUMN `fitRoomResponseTime`;--> statement-breakpoint
ALTER TABLE `tryOnAnalytics` DROP COLUMN `uploadTimeMs`;--> statement-breakpoint
ALTER TABLE `tryOnAnalytics` DROP COLUMN `errorType`;--> statement-breakpoint
ALTER TABLE `tryOnAnalytics` DROP COLUMN `errorMessage`;--> statement-breakpoint
ALTER TABLE `tryOnAnalytics` DROP COLUMN `fitRoomErrorCode`;--> statement-breakpoint
ALTER TABLE `tryOnAnalytics` DROP COLUMN `userAgent`;--> statement-breakpoint
ALTER TABLE `tryOnAnalytics` DROP COLUMN `ipAddress`;--> statement-breakpoint
ALTER TABLE `tryOnAnalytics` DROP COLUMN `updatedAt`;