ALTER TABLE `users` ADD `emailVerified` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerificationToken` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerificationTokenExpiry` timestamp;--> statement-breakpoint
CREATE INDEX `users_email_verification_token` ON `users` (`emailVerificationToken`);