CREATE TABLE `garments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100) NOT NULL,
	`imageUrl` varchar(500) NOT NULL,
	`price` varchar(20),
	`currency` varchar(3) DEFAULT 'ZAR',
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `garments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tryOnResults` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`garmentId` int NOT NULL,
	`userPhotoUrl` varchar(500) NOT NULL,
	`resultImageUrl` varchar(500) NOT NULL,
	`shareToken` varchar(255),
	`shareCount` int DEFAULT 0,
	`isPublic` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tryOnResults_id` PRIMARY KEY(`id`),
	CONSTRAINT `tryOnResults_shareToken_unique` UNIQUE(`shareToken`)
);
