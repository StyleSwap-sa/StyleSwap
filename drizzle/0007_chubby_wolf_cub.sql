CREATE TABLE `widgetAnalytics` (
	`id` varchar(255) NOT NULL,
	`widgetId` varchar(255) NOT NULL,
	`eventType` varchar(50) NOT NULL,
	`data` text,
	`timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `widgetAnalytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `widgets` (
	`id` varchar(255) NOT NULL,
	`boutiqueId` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`primaryColor` varchar(7) NOT NULL DEFAULT '#FF6B35',
	`accentColor` varchar(7) NOT NULL DEFAULT '#004E89',
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `widgets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `clerkId` varchar(255);--> statement-breakpoint
ALTER TABLE `widgetAnalytics` ADD CONSTRAINT `widgetAnalytics_widgetId_widgets_id_fk` FOREIGN KEY (`widgetId`) REFERENCES `widgets`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `widgets` ADD CONSTRAINT `widgets_boutiqueId_boutiques_id_fk` FOREIGN KEY (`boutiqueId`) REFERENCES `boutiques`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_widget_analytics_widget` ON `widgetAnalytics` (`widgetId`);--> statement-breakpoint
CREATE INDEX `idx_widget_analytics_event` ON `widgetAnalytics` (`eventType`);--> statement-breakpoint
CREATE INDEX `idx_widget_analytics_timestamp` ON `widgetAnalytics` (`timestamp`);--> statement-breakpoint
CREATE INDEX `idx_widgets_boutique` ON `widgets` (`boutiqueId`);--> statement-breakpoint
CREATE INDEX `idx_widgets_active` ON `widgets` (`isActive`);--> statement-breakpoint
CREATE INDEX `idx_widgets_created` ON `widgets` (`createdAt`);--> statement-breakpoint
CREATE INDEX `users_clerkId_unique` ON `users` (`clerkId`);