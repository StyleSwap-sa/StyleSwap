CREATE TABLE `batchUploadFiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`batchUploadId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileSize` int NOT NULL,
	`fileUrl` text NOT NULL,
	`clothingType` enum('upper','lower','combo','full') NOT NULL,
	`status` enum('pending','uploaded','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP'
);
--> statement-breakpoint
CREATE TABLE `batchUploads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`boutiqueId` int NOT NULL,
	`userId` int NOT NULL,
	`uploadName` varchar(255) NOT NULL,
	`totalFiles` int NOT NULL DEFAULT 0,
	`successfulFiles` int NOT NULL DEFAULT 0,
	`failedFiles` int NOT NULL DEFAULT 0,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`completedAt` timestamp
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tryOnResultId` int,
	`rating` int NOT NULL,
	`comment` text,
	`helpful` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
ALTER TABLE `batchUploadFiles` ADD CONSTRAINT `batchUploadFiles_batchUploadId_batchUploads_id_fk` FOREIGN KEY (`batchUploadId`) REFERENCES `batchUploads`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batchUploads` ADD CONSTRAINT `batchUploads_boutiqueId_boutiques_id_fk` FOREIGN KEY (`boutiqueId`) REFERENCES `boutiques`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `batchUploads` ADD CONSTRAINT `batchUploads_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_tryOnResultId_tryOnResults_id_fk` FOREIGN KEY (`tryOnResultId`) REFERENCES `tryOnResults`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_batch_files_batch` ON `batchUploadFiles` (`batchUploadId`);--> statement-breakpoint
CREATE INDEX `idx_batch_files_status` ON `batchUploadFiles` (`status`);--> statement-breakpoint
CREATE INDEX `idx_batch_files_created` ON `batchUploadFiles` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_batch_uploads_boutique` ON `batchUploads` (`boutiqueId`);--> statement-breakpoint
CREATE INDEX `idx_batch_uploads_user` ON `batchUploads` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_batch_uploads_status` ON `batchUploads` (`status`);--> statement-breakpoint
CREATE INDEX `idx_batch_uploads_created` ON `batchUploads` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_reviews_user` ON `reviews` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_reviews_try_on` ON `reviews` (`tryOnResultId`);--> statement-breakpoint
CREATE INDEX `idx_reviews_rating` ON `reviews` (`rating`);--> statement-breakpoint
CREATE INDEX `idx_reviews_created` ON `reviews` (`createdAt`);