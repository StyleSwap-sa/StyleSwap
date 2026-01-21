ALTER TABLE `boutiqueSettings` MODIFY COLUMN `brandingColor` varchar(7) DEFAULT '#FF6B35';--> statement-breakpoint
ALTER TABLE `boutiqueSettings` MODIFY COLUMN `customDomain` varchar(255) DEFAULT '';--> statement-breakpoint
ALTER TABLE `boutiqueSettings` MODIFY COLUMN `webhookUrl` varchar(500) DEFAULT '';--> statement-breakpoint
ALTER TABLE `boutiques` ADD `instagramHandle` varchar(255);--> statement-breakpoint
ALTER TABLE `boutiques` ADD `tiktokHandle` varchar(255);--> statement-breakpoint
ALTER TABLE `boutiques` ADD `facebookUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `boutiques` ADD `whatsappNumber` varchar(20);--> statement-breakpoint
ALTER TABLE `boutiques` ADD `isVerified` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `boutiques` ADD `verificationToken` varchar(255);--> statement-breakpoint
ALTER TABLE `boutiques` ADD `verificationTokenExpiry` timestamp;