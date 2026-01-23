CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`boutiqueId` int,
	`userId` int,
	`action` varchar(255) NOT NULL,
	`entityType` varchar(100),
	`entityId` int,
	`changes` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`status` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boutiqueCredits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`boutiqueId` int NOT NULL,
	`totalCredits` int NOT NULL DEFAULT 0,
	`usedCredits` int NOT NULL DEFAULT 0,
	`remainingCredits` int NOT NULL DEFAULT 0,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `boutiqueCredits_id` PRIMARY KEY(`id`),
	CONSTRAINT `boutiqueCredits_boutiqueId_unique` UNIQUE(`boutiqueId`)
);
--> statement-breakpoint
CREATE TABLE `boutiqueSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`boutiqueId` int NOT NULL,
	`brandingColor` varchar(7) DEFAULT '#FF6B35',
	`customDomain` varchar(255) DEFAULT '',
	`enableSharing` int NOT NULL DEFAULT 1,
	`enableAnalytics` int NOT NULL DEFAULT 1,
	`webhookUrl` varchar(500) DEFAULT '',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `boutiqueSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `boutiqueSettings_boutiqueId_unique` UNIQUE(`boutiqueId`)
);
--> statement-breakpoint
CREATE TABLE `boutiqueTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`boutiqueId` int NOT NULL,
	`type` enum('purchase','usage','refund','adjustment') NOT NULL,
	`amount` int NOT NULL,
	`price` decimal(10,2),
	`currency` varchar(3) DEFAULT 'ZAR',
	`productId` int,
	`fitRoomRequestId` varchar(255),
	`initiatedBy` int,
	`description` text,
	`status` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `boutiqueTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boutiqueUsers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`boutiqueId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','manager','staff') NOT NULL DEFAULT 'staff',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `boutiqueUsers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boutiques` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`logoUrl` varchar(500),
	`websiteUrl` varchar(500),
	`instagramHandle` varchar(255),
	`tiktokHandle` varchar(255),
	`facebookUrl` varchar(500),
	`whatsappNumber` varchar(20),
	`ownerId` int NOT NULL,
	`status` enum('active','suspended','inactive') NOT NULL DEFAULT 'active',
	`isVerified` int NOT NULL DEFAULT 0,
	`verificationToken` varchar(255),
	`verificationTokenExpiry` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `boutiques_id` PRIMARY KEY(`id`),
	CONSTRAINT `boutiques_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `deletionLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`boutiqueId` int,
	`userId` int,
	`dataType` varchar(100) NOT NULL,
	`dataId` int,
	`reason` varchar(255),
	`deletedBy` int,
	`deletionHash` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `deletionLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailNotifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('purchase_confirmation','try_on_complete','credits_expiring','promotional') NOT NULL,
	`subject` varchar(255) NOT NULL,
	`recipientEmail` varchar(320) NOT NULL,
	`status` enum('pending','sent','failed','bounced') NOT NULL DEFAULT 'pending',
	`sentAt` timestamp,
	`failureReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailNotifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`garmentId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `garments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100) NOT NULL,
	`imageUrl` varchar(500) NOT NULL,
	`price` varchar(20),
	`currency` varchar(3) DEFAULT 'ZAR',
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `garments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `paymentReconciliation` (
	`id` int AUTO_INCREMENT NOT NULL,
	`yocoTransactionId` varchar(255) NOT NULL,
	`yocoAmount` decimal(10,2) NOT NULL,
	`yocoCurrency` varchar(3) NOT NULL DEFAULT 'ZAR',
	`yocoStatus` varchar(50) NOT NULL,
	`yocoTimestamp` timestamp NOT NULL,
	`styleswapUserId` int,
	`styleswapTransactionId` int,
	`styleswapCreditsAdded` int,
	`styleswapTimestamp` timestamp,
	`reconciliationStatus` enum('matched','unmatched','duplicate','mismatch') NOT NULL DEFAULT 'unmatched',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `paymentReconciliation_id` PRIMARY KEY(`id`),
	CONSTRAINT `paymentReconciliation_yocoTransactionId_unique` UNIQUE(`yocoTransactionId`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`boutiqueId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`sku` varchar(100),
	`description` text,
	`category` varchar(100) NOT NULL,
	`imageUrl` varchar(500) NOT NULL,
	`price` decimal(10,2),
	`currency` varchar(3) DEFAULT 'ZAR',
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('purchase','usage','refund') NOT NULL,
	`amount` int NOT NULL,
	`price` decimal(10,2),
	`currency` varchar(3) DEFAULT 'ZAR',
	`fitRoomOrderId` varchar(255),
	`description` text,
	`status` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tryOnResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`boutiqueId` int,
	`userId` int NOT NULL,
	`productId` int,
	`garmentId` int,
	`userPhotoUrl` varchar(500) NOT NULL,
	`resultImageUrl` varchar(500),
	`fitRoomTaskId` varchar(255),
	`fitRoomRequestId` varchar(255),
	`shareToken` varchar(255),
	`shareCount` int DEFAULT 0,
	`isPublic` int DEFAULT 0,
	`flowType` enum('b2c','b2b') NOT NULL DEFAULT 'b2c',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tryOnResults_id` PRIMARY KEY(`id`),
	CONSTRAINT `tryOnResults_shareToken_unique` UNIQUE(`shareToken`)
);
--> statement-breakpoint
CREATE TABLE `userCredits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalCredits` int NOT NULL DEFAULT 0,
	`usedCredits` int NOT NULL DEFAULT 0,
	`remainingCredits` int NOT NULL DEFAULT 0,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userCredits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`phone` varchar(20),
	`loginMethod` varchar(64),
	`role` enum('user','admin','merchant') NOT NULL DEFAULT 'user',
	`userType` enum('customer','merchant','admin') NOT NULL DEFAULT 'customer',
	`currentBoutiqueId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE `webhookAlerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`alertType` enum('webhook_failed','webhook_max_retries','payment_unmatched','payment_mismatch') NOT NULL,
	`severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`webhookEventId` int,
	`paymentReconciliationId` int,
	`title` varchar(255) NOT NULL,
	`description` text,
	`isResolved` int NOT NULL DEFAULT 0,
	`resolvedAt` timestamp,
	`resolvedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `webhookAlerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `webhookEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`source` varchar(50) NOT NULL,
	`eventType` varchar(100) NOT NULL,
	`externalEventId` varchar(255) NOT NULL,
	`payload` text NOT NULL,
	`status` enum('pending','processing','success','failed','retrying') NOT NULL DEFAULT 'pending',
	`retryCount` int NOT NULL DEFAULT 0,
	`maxRetries` int NOT NULL DEFAULT 3,
	`lastRetryAt` timestamp,
	`nextRetryAt` timestamp,
	`error` text,
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `webhookEvents_id` PRIMARY KEY(`id`),
	CONSTRAINT `webhookEvents_externalEventId_unique` UNIQUE(`externalEventId`)
);
--> statement-breakpoint
ALTER TABLE `auditLogs` ADD CONSTRAINT `auditLogs_boutiqueId_boutiques_id_fk` FOREIGN KEY (`boutiqueId`) REFERENCES `boutiques`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `auditLogs` ADD CONSTRAINT `auditLogs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `boutiqueCredits` ADD CONSTRAINT `boutiqueCredits_boutiqueId_boutiques_id_fk` FOREIGN KEY (`boutiqueId`) REFERENCES `boutiques`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `boutiqueSettings` ADD CONSTRAINT `boutiqueSettings_boutiqueId_boutiques_id_fk` FOREIGN KEY (`boutiqueId`) REFERENCES `boutiques`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `boutiqueTransactions` ADD CONSTRAINT `boutiqueTransactions_boutiqueId_boutiques_id_fk` FOREIGN KEY (`boutiqueId`) REFERENCES `boutiques`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `boutiqueTransactions` ADD CONSTRAINT `boutiqueTransactions_initiatedBy_users_id_fk` FOREIGN KEY (`initiatedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `boutiqueUsers` ADD CONSTRAINT `boutiqueUsers_boutiqueId_boutiques_id_fk` FOREIGN KEY (`boutiqueId`) REFERENCES `boutiques`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `boutiqueUsers` ADD CONSTRAINT `boutiqueUsers_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `boutiques` ADD CONSTRAINT `boutiques_ownerId_users_id_fk` FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deletionLogs` ADD CONSTRAINT `deletionLogs_boutiqueId_boutiques_id_fk` FOREIGN KEY (`boutiqueId`) REFERENCES `boutiques`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deletionLogs` ADD CONSTRAINT `deletionLogs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `deletionLogs` ADD CONSTRAINT `deletionLogs_deletedBy_users_id_fk` FOREIGN KEY (`deletedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `emailNotifications` ADD CONSTRAINT `emailNotifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_garmentId_garments_id_fk` FOREIGN KEY (`garmentId`) REFERENCES `garments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `paymentReconciliation` ADD CONSTRAINT `paymentReconciliation_styleswapUserId_users_id_fk` FOREIGN KEY (`styleswapUserId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `paymentReconciliation` ADD CONSTRAINT `paymentReconciliation_styleswapTransactionId_transactions_id_fk` FOREIGN KEY (`styleswapTransactionId`) REFERENCES `transactions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_boutiqueId_boutiques_id_fk` FOREIGN KEY (`boutiqueId`) REFERENCES `boutiques`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tryOnResults` ADD CONSTRAINT `tryOnResults_boutiqueId_boutiques_id_fk` FOREIGN KEY (`boutiqueId`) REFERENCES `boutiques`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tryOnResults` ADD CONSTRAINT `tryOnResults_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tryOnResults` ADD CONSTRAINT `tryOnResults_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tryOnResults` ADD CONSTRAINT `tryOnResults_garmentId_garments_id_fk` FOREIGN KEY (`garmentId`) REFERENCES `garments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userCredits` ADD CONSTRAINT `userCredits_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `webhookAlerts` ADD CONSTRAINT `webhookAlerts_webhookEventId_webhookEvents_id_fk` FOREIGN KEY (`webhookEventId`) REFERENCES `webhookEvents`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `webhookAlerts` ADD CONSTRAINT `webhookAlerts_paymentReconciliationId_paymentReconciliation_id_fk` FOREIGN KEY (`paymentReconciliationId`) REFERENCES `paymentReconciliation`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `webhookAlerts` ADD CONSTRAINT `webhookAlerts_resolvedBy_users_id_fk` FOREIGN KEY (`resolvedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_audit_logs_boutique` ON `auditLogs` (`boutiqueId`);--> statement-breakpoint
CREATE INDEX `idx_audit_logs_user` ON `auditLogs` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_audit_logs_action` ON `auditLogs` (`action`);--> statement-breakpoint
CREATE INDEX `idx_audit_logs_created` ON `auditLogs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_boutique_credits_boutique` ON `boutiqueCredits` (`boutiqueId`);--> statement-breakpoint
CREATE INDEX `idx_boutique_transactions_boutique` ON `boutiqueTransactions` (`boutiqueId`);--> statement-breakpoint
CREATE INDEX `idx_boutique_transactions_type` ON `boutiqueTransactions` (`type`);--> statement-breakpoint
CREATE INDEX `idx_boutique_transactions_created` ON `boutiqueTransactions` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_boutique_user_boutique` ON `boutiqueUsers` (`boutiqueId`);--> statement-breakpoint
CREATE INDEX `idx_boutique_user_user` ON `boutiqueUsers` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_boutique_owner` ON `boutiques` (`ownerId`);--> statement-breakpoint
CREATE INDEX `idx_boutique_status` ON `boutiques` (`status`);--> statement-breakpoint
CREATE INDEX `idx_deletion_logs_boutique` ON `deletionLogs` (`boutiqueId`);--> statement-breakpoint
CREATE INDEX `idx_deletion_logs_created` ON `deletionLogs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_email_notifications_user` ON `emailNotifications` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_favorites_user` ON `favorites` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_garments_active` ON `garments` (`isActive`);--> statement-breakpoint
CREATE INDEX `idx_reconciliation_yoco_id` ON `paymentReconciliation` (`yocoTransactionId`);--> statement-breakpoint
CREATE INDEX `idx_reconciliation_user` ON `paymentReconciliation` (`styleswapUserId`);--> statement-breakpoint
CREATE INDEX `idx_reconciliation_status` ON `paymentReconciliation` (`reconciliationStatus`);--> statement-breakpoint
CREATE INDEX `idx_reconciliation_timestamp` ON `paymentReconciliation` (`yocoTimestamp`);--> statement-breakpoint
CREATE INDEX `idx_reconciliation_created` ON `paymentReconciliation` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_products_boutique` ON `products` (`boutiqueId`);--> statement-breakpoint
CREATE INDEX `idx_products_active` ON `products` (`isActive`);--> statement-breakpoint
CREATE INDEX `idx_transactions_user` ON `transactions` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_transactions_type` ON `transactions` (`type`);--> statement-breakpoint
CREATE INDEX `idx_tryon_boutique` ON `tryOnResults` (`boutiqueId`);--> statement-breakpoint
CREATE INDEX `idx_tryon_user` ON `tryOnResults` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_tryon_flowtype` ON `tryOnResults` (`flowType`);--> statement-breakpoint
CREATE INDEX `idx_user_credits_user` ON `userCredits` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_alerts_type` ON `webhookAlerts` (`alertType`);--> statement-breakpoint
CREATE INDEX `idx_alerts_severity` ON `webhookAlerts` (`severity`);--> statement-breakpoint
CREATE INDEX `idx_alerts_resolved` ON `webhookAlerts` (`isResolved`);--> statement-breakpoint
CREATE INDEX `idx_alerts_created` ON `webhookAlerts` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_webhook_source` ON `webhookEvents` (`source`);--> statement-breakpoint
CREATE INDEX `idx_webhook_status` ON `webhookEvents` (`status`);--> statement-breakpoint
CREATE INDEX `idx_webhook_external_id` ON `webhookEvents` (`externalEventId`);--> statement-breakpoint
CREATE INDEX `idx_webhook_next_retry` ON `webhookEvents` (`nextRetryAt`);--> statement-breakpoint
CREATE INDEX `idx_webhook_created` ON `webhookEvents` (`createdAt`);