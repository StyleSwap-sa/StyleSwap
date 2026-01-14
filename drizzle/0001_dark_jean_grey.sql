CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('purchase','usage','refund') NOT NULL,
	`amount` int NOT NULL,
	`price` varchar(20),
	`currency` varchar(3) DEFAULT 'ZAR',
	`fitRoomOrderId` varchar(255),
	`description` text,
	`status` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userCredits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalCredits` int NOT NULL DEFAULT 0,
	`usedCredits` int NOT NULL DEFAULT 0,
	`remainingCredits` int NOT NULL DEFAULT 0,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userCredits_id` PRIMARY KEY(`id`)
);
