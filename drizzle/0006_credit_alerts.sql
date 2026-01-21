CREATE TABLE `creditAlertPreferences` (
`id` int AUTO_INCREMENT NOT NULL,
`userId` int NOT NULL,
`alertAt80Percent` int NOT NULL DEFAULT 1,
`alertAt50Percent` int NOT NULL DEFAULT 1,
`alertAt20Percent` int NOT NULL DEFAULT 1,
`alertAt10Percent` int NOT NULL DEFAULT 1,
`emailNotifications` int NOT NULL DEFAULT 1,
`inAppNotifications` int NOT NULL DEFAULT 1,
`lastAlertSentAt` timestamp,
`createdAt` timestamp NOT NULL DEFAULT (now()),
`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
CONSTRAINT `creditAlertPreferences_id` PRIMARY KEY(`id`),
CONSTRAINT `creditAlertPreferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `creditAlertsLog` (
`id` int AUTO_INCREMENT NOT NULL,
`userId` int NOT NULL,
`alertType` enum('80_percent','50_percent','20_percent','10_percent') NOT NULL,
`creditsRemaining` int NOT NULL,
`creditsUsed` int NOT NULL,
`totalCredits` int NOT NULL,
`emailSent` int NOT NULL DEFAULT 0,
`inAppNotificationSent` int NOT NULL DEFAULT 0,
`createdAt` timestamp NOT NULL DEFAULT (now()),
CONSTRAINT `creditAlertsLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_alert_prefs_user` ON `creditAlertPreferences` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_alerts_log_user` ON `creditAlertsLog` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_alerts_log_created` ON `creditAlertsLog` (`createdAt`);--> statement-breakpoint
ALTER TABLE `creditAlertPreferences` ADD CONSTRAINT `creditAlertPreferences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `creditAlertsLog` ADD CONSTRAINT `creditAlertsLog_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;
