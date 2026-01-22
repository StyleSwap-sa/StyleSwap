CREATE TABLE `emailVerifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`token` varchar(255) NOT NULL,
	`isVerified` int NOT NULL DEFAULT 0,
	`expiresAt` timestamp NOT NULL,
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailVerifications_id` PRIMARY KEY(`id`),
	CONSTRAINT `emailVerifications_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `shareMetrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`boutiqueId` int NOT NULL,
	`totalShares` int NOT NULL DEFAULT 0,
	`instagramShares` int NOT NULL DEFAULT 0,
	`tiktokShares` int NOT NULL DEFAULT 0,
	`twitterShares` int NOT NULL DEFAULT 0,
	`facebookShares` int NOT NULL DEFAULT 0,
	`whatsappShares` int NOT NULL DEFAULT 0,
	`totalClicks` int NOT NULL DEFAULT 0,
	`totalConversions` int NOT NULL DEFAULT 0,
	`conversionRate` decimal(5,2) NOT NULL DEFAULT '0.00',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shareMetrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `socialShares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tryOnId` int NOT NULL,
	`userId` int NOT NULL,
	`platform` enum('instagram','tiktok','twitter','facebook','whatsapp') NOT NULL,
	`shareUrl` varchar(500),
	`clickCount` int NOT NULL DEFAULT 0,
	`conversionCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `socialShares_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tryOnHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`boutiqueId` int,
	`garmentId` int,
	`originalImageUrl` varchar(500) NOT NULL,
	`resultImageUrl` varchar(500) NOT NULL,
	`garmentName` varchar(255),
	`garmentColor` varchar(100),
	`garmentSize` varchar(50),
	`isFavorite` int NOT NULL DEFAULT 0,
	`shareCount` int NOT NULL DEFAULT 0,
	`downloadCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tryOnHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `emailVerifications` ADD CONSTRAINT `emailVerifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `shareMetrics` ADD CONSTRAINT `shareMetrics_boutiqueId_boutiques_id_fk` FOREIGN KEY (`boutiqueId`) REFERENCES `boutiques`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `socialShares` ADD CONSTRAINT `socialShares_tryOnId_tryOnHistory_id_fk` FOREIGN KEY (`tryOnId`) REFERENCES `tryOnHistory`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `socialShares` ADD CONSTRAINT `socialShares_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tryOnHistory` ADD CONSTRAINT `tryOnHistory_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tryOnHistory` ADD CONSTRAINT `tryOnHistory_boutiqueId_boutiques_id_fk` FOREIGN KEY (`boutiqueId`) REFERENCES `boutiques`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tryOnHistory` ADD CONSTRAINT `tryOnHistory_garmentId_garments_id_fk` FOREIGN KEY (`garmentId`) REFERENCES `garments`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_email_verifications_user` ON `emailVerifications` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_email_verifications_token` ON `emailVerifications` (`token`);--> statement-breakpoint
CREATE INDEX `idx_email_verifications_expires` ON `emailVerifications` (`expiresAt`);--> statement-breakpoint
CREATE INDEX `idx_share_metrics_boutique` ON `shareMetrics` (`boutiqueId`);--> statement-breakpoint
CREATE INDEX `idx_social_shares_try_on` ON `socialShares` (`tryOnId`);--> statement-breakpoint
CREATE INDEX `idx_social_shares_user` ON `socialShares` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_social_shares_platform` ON `socialShares` (`platform`);--> statement-breakpoint
CREATE INDEX `idx_social_shares_created` ON `socialShares` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_try_on_history_user` ON `tryOnHistory` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_try_on_history_boutique` ON `tryOnHistory` (`boutiqueId`);--> statement-breakpoint
CREATE INDEX `idx_try_on_history_created` ON `tryOnHistory` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_try_on_history_favorite` ON `tryOnHistory` (`isFavorite`);