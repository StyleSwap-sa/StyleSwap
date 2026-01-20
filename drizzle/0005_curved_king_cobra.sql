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
	`brandingColor` varchar(7),
	`customDomain` varchar(255),
	`enableSharing` int NOT NULL DEFAULT 1,
	`enableAnalytics` int NOT NULL DEFAULT 1,
	`webhookUrl` varchar(500),
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
	`ownerId` int NOT NULL,
	`status` enum('active','suspended','inactive') NOT NULL DEFAULT 'active',
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
ALTER TABLE `transactions` MODIFY COLUMN `price` decimal(10,2);--> statement-breakpoint
ALTER TABLE `tryOnResults` MODIFY COLUMN `garmentId` int;--> statement-breakpoint
ALTER TABLE `tryOnResults` MODIFY COLUMN `resultImageUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','merchant') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `tryOnResults` ADD `boutiqueId` int;--> statement-breakpoint
ALTER TABLE `tryOnResults` ADD `productId` int;--> statement-breakpoint
ALTER TABLE `tryOnResults` ADD `fitRoomTaskId` varchar(255);--> statement-breakpoint
ALTER TABLE `tryOnResults` ADD `fitRoomRequestId` varchar(255);--> statement-breakpoint
ALTER TABLE `tryOnResults` ADD `flowType` enum('b2c','b2b') DEFAULT 'b2c' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `userType` enum('customer','merchant','admin') DEFAULT 'customer' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `currentBoutiqueId` int;--> statement-breakpoint
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
ALTER TABLE `products` ADD CONSTRAINT `products_boutiqueId_boutiques_id_fk` FOREIGN KEY (`boutiqueId`) REFERENCES `boutiques`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
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
CREATE INDEX `idx_products_boutique` ON `products` (`boutiqueId`);--> statement-breakpoint
CREATE INDEX `idx_products_active` ON `products` (`isActive`);--> statement-breakpoint
ALTER TABLE `emailNotifications` ADD CONSTRAINT `emailNotifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_garmentId_garments_id_fk` FOREIGN KEY (`garmentId`) REFERENCES `garments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tryOnResults` ADD CONSTRAINT `tryOnResults_boutiqueId_boutiques_id_fk` FOREIGN KEY (`boutiqueId`) REFERENCES `boutiques`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tryOnResults` ADD CONSTRAINT `tryOnResults_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tryOnResults` ADD CONSTRAINT `tryOnResults_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tryOnResults` ADD CONSTRAINT `tryOnResults_garmentId_garments_id_fk` FOREIGN KEY (`garmentId`) REFERENCES `garments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userCredits` ADD CONSTRAINT `userCredits_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_email_notifications_user` ON `emailNotifications` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_favorites_user` ON `favorites` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_garments_active` ON `garments` (`isActive`);--> statement-breakpoint
CREATE INDEX `idx_transactions_user` ON `transactions` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_transactions_type` ON `transactions` (`type`);--> statement-breakpoint
CREATE INDEX `idx_tryon_boutique` ON `tryOnResults` (`boutiqueId`);--> statement-breakpoint
CREATE INDEX `idx_tryon_user` ON `tryOnResults` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_tryon_flowtype` ON `tryOnResults` (`flowType`);--> statement-breakpoint
CREATE INDEX `idx_user_credits_user` ON `userCredits` (`userId`);