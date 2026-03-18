ALTER TABLE `boutiqueCredits` DROP INDEX `boutiqueCredits_boutiqueId_unique`;--> statement-breakpoint
ALTER TABLE `boutiqueSettings` DROP INDEX `boutiqueSettings_boutiqueId_unique`;--> statement-breakpoint
ALTER TABLE `boutiques` DROP INDEX `boutiques_slug_unique`;--> statement-breakpoint
ALTER TABLE `tryOnResults` DROP INDEX `tryOnResults_shareToken_unique`;--> statement-breakpoint
ALTER TABLE `users` DROP INDEX `users_openId_unique`;--> statement-breakpoint
ALTER TABLE `paymentReconciliation` DROP FOREIGN KEY `paymentReconciliation_styleswapUserId_users_id_fk`;
--> statement-breakpoint
ALTER TABLE `paymentReconciliation` DROP FOREIGN KEY `paymentReconciliation_styleswapTransactionId_transactions_id_fk`;
--> statement-breakpoint
ALTER TABLE `webhookAlerts` DROP FOREIGN KEY `webhookAlerts_webhookEventId_webhookEvents_id_fk`;
--> statement-breakpoint
ALTER TABLE `webhookAlerts` DROP FOREIGN KEY `webhookAlerts_paymentReconciliationId_paymentReconciliation_id_fk`;
--> statement-breakpoint
ALTER TABLE `webhookAlerts` DROP FOREIGN KEY `webhookAlerts_resolvedBy_users_id_fk`;
--> statement-breakpoint
DROP INDEX `idx_reconciliation_yoco_id` ON `paymentReconciliation`;--> statement-breakpoint
DROP INDEX `idx_reconciliation_user` ON `paymentReconciliation`;--> statement-breakpoint
DROP INDEX `idx_reconciliation_status` ON `paymentReconciliation`;--> statement-breakpoint
DROP INDEX `idx_reconciliation_timestamp` ON `paymentReconciliation`;--> statement-breakpoint
DROP INDEX `idx_reconciliation_created` ON `paymentReconciliation`;--> statement-breakpoint
DROP INDEX `idx_alerts_type` ON `webhookAlerts`;--> statement-breakpoint
DROP INDEX `idx_alerts_severity` ON `webhookAlerts`;--> statement-breakpoint
DROP INDEX `idx_alerts_resolved` ON `webhookAlerts`;--> statement-breakpoint
DROP INDEX `idx_alerts_created` ON `webhookAlerts`;--> statement-breakpoint
DROP INDEX `idx_webhook_next_retry` ON `webhookEvents`;--> statement-breakpoint
DROP INDEX `idx_webhook_created` ON `webhookEvents`;--> statement-breakpoint
ALTER TABLE `auditLogs` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `boutiqueCredits` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `boutiqueSettings` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `boutiqueTransactions` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `boutiqueUsers` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `boutiques` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `deletionLogs` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `emailNotifications` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `favorites` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `garments` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `paymentReconciliation` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `products` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `transactions` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `tryOnResults` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `userCredits` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `users` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `webhookAlerts` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `webhookEvents` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `auditLogs` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `boutiqueCredits` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `boutiqueSettings` MODIFY COLUMN `enableSharing` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `boutiqueSettings` MODIFY COLUMN `enableAnalytics` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `boutiqueSettings` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `boutiqueTransactions` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `boutiqueUsers` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `boutiques` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `deletionLogs` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `emailNotifications` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `favorites` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `garments` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `paymentReconciliation` MODIFY COLUMN `yocoCurrency` varchar(3) NOT NULL;--> statement-breakpoint
ALTER TABLE `paymentReconciliation` MODIFY COLUMN `reconciliationStatus` enum('unmatched','matched','mismatch') NOT NULL DEFAULT 'unmatched';--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `transactions` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `tryOnResults` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `userCredits` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `lastSignedIn` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `webhookEvents` MODIFY COLUMN `source` enum('yoco','fitroom') NOT NULL;--> statement-breakpoint
ALTER TABLE `webhookEvents` MODIFY COLUMN `payload` json;--> statement-breakpoint
ALTER TABLE `webhookEvents` MODIFY COLUMN `status` enum('pending','retrying','success','failed') NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE `webhookEvents` MODIFY COLUMN `nextRetryAt` timestamp NOT NULL;--> statement-breakpoint
CREATE INDEX `boutiqueCredits_boutiqueId_unique` ON `boutiqueCredits` (`boutiqueId`);--> statement-breakpoint
CREATE INDEX `boutiqueSettings_boutiqueId_unique` ON `boutiqueSettings` (`boutiqueId`);--> statement-breakpoint
CREATE INDEX `boutiques_slug_unique` ON `boutiques` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_payment_yoco_id` ON `paymentReconciliation` (`yocoTransactionId`);--> statement-breakpoint
CREATE INDEX `idx_payment_status` ON `paymentReconciliation` (`reconciliationStatus`);--> statement-breakpoint
CREATE INDEX `idx_payment_user` ON `paymentReconciliation` (`styleswapUserId`);--> statement-breakpoint
CREATE INDEX `tryOnResults_shareToken_unique` ON `tryOnResults` (`shareToken`);--> statement-breakpoint
CREATE INDEX `users_openId_unique` ON `users` (`openId`);--> statement-breakpoint
CREATE INDEX `idx_alert_type` ON `webhookAlerts` (`alertType`);--> statement-breakpoint
CREATE INDEX `idx_alert_severity` ON `webhookAlerts` (`severity`);--> statement-breakpoint
CREATE INDEX `idx_alert_resolved` ON `webhookAlerts` (`isResolved`);--> statement-breakpoint
ALTER TABLE `paymentReconciliation` DROP COLUMN `notes`;