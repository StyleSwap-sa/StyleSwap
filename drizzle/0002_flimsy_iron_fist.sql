CREATE TABLE `analyticsSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`snapshotDate` varchar(10) NOT NULL,
	`imageOptimizationVersion` varchar(50) NOT NULL,
	`flowType` enum('b2c','b2b') NOT NULL,
	`totalAttempts` int NOT NULL DEFAULT 0,
	`successfulAttempts` int NOT NULL DEFAULT 0,
	`failedAttempts` int NOT NULL DEFAULT 0,
	`successRate` decimal(5,2) NOT NULL DEFAULT 0,
	`avgProcessingTimeMs` int,
	`p95ProcessingTimeMs` int,
	`p99ProcessingTimeMs` int,
	`avgUploadTimeMs` int,
	`avgFitRoomResponseTimeMs` int,
	`avgOriginalModelImageSize` int,
	`avgOptimizedModelImageSize` int,
	`avgOriginalClothImageSize` int,
	`avgOptimizedClothImageSize` int,
	`compressionRatio` decimal(5,2),
	`topErrorType` varchar(100),
	`errorTypeBreakdown` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `tryOnAnalytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tryOnResultId` int NOT NULL,
	`userId` int NOT NULL,
	`boutiqueId` int,
	`flowType` enum('b2c','b2b') NOT NULL DEFAULT 'b2c',
	`imageOptimizationVersion` varchar(50) NOT NULL DEFAULT 'v1',
	`originalModelImageWidth` int,
	`originalModelImageHeight` int,
	`originalModelImageSize` int,
	`optimizedModelImageWidth` int,
	`optimizedModelImageHeight` int,
	`optimizedModelImageSize` int,
	`originalClothImageWidth` int,
	`originalClothImageHeight` int,
	`originalClothImageSize` int,
	`optimizedClothImageWidth` int,
	`optimizedClothImageHeight` int,
	`optimizedClothImageSize` int,
	`success` int NOT NULL DEFAULT 0,
	`processingTimeMs` int,
	`fitRoomResponseTime` int,
	`uploadTimeMs` int,
	`errorType` varchar(100),
	`errorMessage` text,
	`fitRoomErrorCode` varchar(50),
	`userAgent` text,
	`ipAddress` varchar(45),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
ALTER TABLE `tryOnAnalytics` ADD CONSTRAINT `tryOnAnalytics_tryOnResultId_tryOnResults_id_fk` FOREIGN KEY (`tryOnResultId`) REFERENCES `tryOnResults`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tryOnAnalytics` ADD CONSTRAINT `tryOnAnalytics_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tryOnAnalytics` ADD CONSTRAINT `tryOnAnalytics_boutiqueId_boutiques_id_fk` FOREIGN KEY (`boutiqueId`) REFERENCES `boutiques`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_snapshot_date` ON `analyticsSnapshots` (`snapshotDate`);--> statement-breakpoint
CREATE INDEX `idx_snapshot_version` ON `analyticsSnapshots` (`imageOptimizationVersion`);--> statement-breakpoint
CREATE INDEX `idx_snapshot_flow` ON `analyticsSnapshots` (`flowType`);--> statement-breakpoint
CREATE INDEX `idx_analytics_user` ON `tryOnAnalytics` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_analytics_boutique` ON `tryOnAnalytics` (`boutiqueId`);--> statement-breakpoint
CREATE INDEX `idx_analytics_success` ON `tryOnAnalytics` (`success`);--> statement-breakpoint
CREATE INDEX `idx_analytics_version` ON `tryOnAnalytics` (`imageOptimizationVersion`);--> statement-breakpoint
CREATE INDEX `idx_analytics_created` ON `tryOnAnalytics` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_analytics_error` ON `tryOnAnalytics` (`errorType`);--> statement-breakpoint
CREATE INDEX `idx_analytics_flow` ON `tryOnAnalytics` (`flowType`);