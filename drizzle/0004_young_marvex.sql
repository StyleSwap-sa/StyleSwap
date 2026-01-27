CREATE TABLE `customerSizePreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`boutiqueId` int NOT NULL,
	`bodySize` int NOT NULL,
	`preferredSize` int,
	`clothingType` varchar(50) NOT NULL,
	`bodyType` varchar(50),
	`height` varchar(20),
	`weight` varchar(20),
	`notes` text,
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	CONSTRAINT `customerSizePreferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sizeReviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`boutiqueId` int NOT NULL,
	`tryOnResultId` int,
	`clothingType` varchar(50) NOT NULL,
	`selectedSize` int NOT NULL,
	`bodySize` int NOT NULL,
	`fitRating` enum('tight','perfect','loose') NOT NULL,
	`helpfulnessRating` int DEFAULT 0,
	`reviewText` text,
	`recommendedSize` int,
	`bodyType` varchar(50),
	`height` varchar(20),
	`weight` varchar(20),
	`helpfulCount` int DEFAULT 0,
	`unhelpfulCount` int DEFAULT 0,
	`isVerifiedPurchase` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sizeReviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `customerSizePreferences` ADD CONSTRAINT `customerSizePreferences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customerSizePreferences` ADD CONSTRAINT `customerSizePreferences_boutiqueId_boutiques_id_fk` FOREIGN KEY (`boutiqueId`) REFERENCES `boutiques`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sizeReviews` ADD CONSTRAINT `sizeReviews_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sizeReviews` ADD CONSTRAINT `sizeReviews_boutiqueId_boutiques_id_fk` FOREIGN KEY (`boutiqueId`) REFERENCES `boutiques`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sizeReviews` ADD CONSTRAINT `sizeReviews_tryOnResultId_tryOnResults_id_fk` FOREIGN KEY (`tryOnResultId`) REFERENCES `tryOnResults`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_customer_prefs_user` ON `customerSizePreferences` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_customer_prefs_boutique` ON `customerSizePreferences` (`boutiqueId`);--> statement-breakpoint
CREATE INDEX `idx_customer_prefs_body_size` ON `customerSizePreferences` (`bodySize`);--> statement-breakpoint
CREATE INDEX `idx_customer_prefs_clothing_type` ON `customerSizePreferences` (`clothingType`);--> statement-breakpoint
CREATE INDEX `idx_customer_prefs_body_type` ON `customerSizePreferences` (`bodyType`);--> statement-breakpoint
CREATE INDEX `idx_size_reviews_user` ON `sizeReviews` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_size_reviews_boutique` ON `sizeReviews` (`boutiqueId`);--> statement-breakpoint
CREATE INDEX `idx_size_reviews_clothing_type` ON `sizeReviews` (`clothingType`);--> statement-breakpoint
CREATE INDEX `idx_size_reviews_selected_size` ON `sizeReviews` (`selectedSize`);--> statement-breakpoint
CREATE INDEX `idx_size_reviews_body_size` ON `sizeReviews` (`bodySize`);--> statement-breakpoint
CREATE INDEX `idx_size_reviews_fit_rating` ON `sizeReviews` (`fitRating`);--> statement-breakpoint
CREATE INDEX `idx_size_reviews_body_type` ON `sizeReviews` (`bodyType`);--> statement-breakpoint
CREATE INDEX `idx_size_reviews_created` ON `sizeReviews` (`createdAt`);