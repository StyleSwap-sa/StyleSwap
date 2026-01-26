CREATE TABLE `productSizeVariants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`size` int NOT NULL,
	`stock` int NOT NULL DEFAULT 0,
	`isAvailable` int NOT NULL DEFAULT 1,
	`fitAdjustment` enum('tight','perfect','loose') NOT NULL DEFAULT 'perfect',
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
ALTER TABLE `products` ADD `hasSizeVariants` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `productSizeVariants` ADD CONSTRAINT `productSizeVariants_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_product_size_product` ON `productSizeVariants` (`productId`);--> statement-breakpoint
CREATE INDEX `idx_product_size_available` ON `productSizeVariants` (`isAvailable`);