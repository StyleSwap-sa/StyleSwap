-- Add new columns to users table for boutique support
ALTER TABLE `users` ADD COLUMN `userType` enum('customer','merchant','admin') NOT NULL DEFAULT 'customer' AFTER `role`;
ALTER TABLE `users` ADD COLUMN `currentBoutiqueId` int AFTER `userType`;

-- Create boutiques table
CREATE TABLE `boutiques` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL UNIQUE,
  `description` text,
  `logoUrl` varchar(500),
  `websiteUrl` varchar(500),
  `ownerId` int NOT NULL,
  `status` enum('active','suspended','inactive') NOT NULL DEFAULT 'active',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`ownerId`) REFERENCES `users`(`id`),
  INDEX `idx_boutique_owner` (`ownerId`),
  INDEX `idx_boutique_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create boutiqueUsers table
CREATE TABLE `boutiqueUsers` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `boutiqueId` int NOT NULL,
  `userId` int NOT NULL,
  `role` enum('owner','manager','staff') NOT NULL DEFAULT 'staff',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`boutiqueId`) REFERENCES `boutiques`(`id`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`),
  INDEX `idx_boutique_user_boutique` (`boutiqueId`),
  INDEX `idx_boutique_user_user` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create boutiqueSettings table
CREATE TABLE `boutiqueSettings` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `boutiqueId` int NOT NULL UNIQUE,
  `brandingColor` varchar(7),
  `customDomain` varchar(255),
  `enableSharing` int NOT NULL DEFAULT 1,
  `enableAnalytics` int NOT NULL DEFAULT 1,
  `webhookUrl` varchar(500),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`boutiqueId`) REFERENCES `boutiques`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create boutiqueCredits table
CREATE TABLE `boutiqueCredits` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `boutiqueId` int NOT NULL UNIQUE,
  `totalCredits` int NOT NULL DEFAULT 0,
  `usedCredits` int NOT NULL DEFAULT 0,
  `remainingCredits` int NOT NULL DEFAULT 0,
  `expiresAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`boutiqueId`) REFERENCES `boutiques`(`id`),
  INDEX `idx_boutique_credits_boutique` (`boutiqueId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create boutiqueTransactions table
CREATE TABLE `boutiqueTransactions` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `boutiqueId` int NOT NULL,
  `type` enum('purchase','usage','refund','adjustment') NOT NULL,
  `amount` int NOT NULL,
  `price` decimal(10,2),
  `currency` varchar(3) DEFAULT 'ZAR',
  `productId` int,
  `fitRoomRequestId` varchar(255),
  `initiatedBy` int,
  `description` text,
  `status` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`boutiqueId`) REFERENCES `boutiques`(`id`),
  FOREIGN KEY (`initiatedBy`) REFERENCES `users`(`id`),
  INDEX `idx_boutique_transactions_boutique` (`boutiqueId`),
  INDEX `idx_boutique_transactions_type` (`type`),
  INDEX `idx_boutique_transactions_created` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create products table (per-boutique product catalogue)
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `boutiqueId` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `sku` varchar(100),
  `description` text,
  `category` varchar(100) NOT NULL,
  `imageUrl` varchar(500) NOT NULL,
  `price` decimal(10,2),
  `currency` varchar(3) DEFAULT 'ZAR',
  `isActive` int NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`boutiqueId`) REFERENCES `boutiques`(`id`),
  INDEX `idx_products_boutique` (`boutiqueId`),
  INDEX `idx_products_active` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add new columns to tryOnResults for boutique support
ALTER TABLE `tryOnResults` ADD COLUMN `boutiqueId` int AFTER `id`;
ALTER TABLE `tryOnResults` ADD COLUMN `productId` int AFTER `garmentId`;
ALTER TABLE `tryOnResults` ADD COLUMN `fitRoomTaskId` varchar(255) AFTER `resultImageUrl`;
ALTER TABLE `tryOnResults` ADD COLUMN `fitRoomRequestId` varchar(255) AFTER `fitRoomTaskId`;
ALTER TABLE `tryOnResults` ADD COLUMN `flowType` enum('b2c','b2b') NOT NULL DEFAULT 'b2c' AFTER `isPublic`;
ALTER TABLE `tryOnResults` ADD FOREIGN KEY (`boutiqueId`) REFERENCES `boutiques`(`id`);
ALTER TABLE `tryOnResults` ADD FOREIGN KEY (`productId`) REFERENCES `products`(`id`);
ALTER TABLE `tryOnResults` ADD INDEX `idx_tryon_boutique` (`boutiqueId`);
ALTER TABLE `tryOnResults` ADD INDEX `idx_tryon_flowtype` (`flowType`);

-- Create auditLogs table (POPIA compliance)
CREATE TABLE `auditLogs` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `boutiqueId` int,
  `userId` int,
  `action` varchar(255) NOT NULL,
  `entityType` varchar(100),
  `entityId` int,
  `changes` text,
  `ipAddress` varchar(45),
  `userAgent` text,
  `status` varchar(50),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`boutiqueId`) REFERENCES `boutiques`(`id`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`),
  INDEX `idx_audit_logs_boutique` (`boutiqueId`),
  INDEX `idx_audit_logs_user` (`userId`),
  INDEX `idx_audit_logs_action` (`action`),
  INDEX `idx_audit_logs_created` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create deletionLogs table (POPIA 7-day auto-deletion tracking)
CREATE TABLE `deletionLogs` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `boutiqueId` int,
  `userId` int,
  `dataType` varchar(100) NOT NULL,
  `dataId` int,
  `reason` varchar(255),
  `deletedBy` int,
  `deletionHash` varchar(255),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`boutiqueId`) REFERENCES `boutiques`(`id`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`),
  FOREIGN KEY (`deletedBy`) REFERENCES `users`(`id`),
  INDEX `idx_deletion_logs_boutique` (`boutiqueId`),
  INDEX `idx_deletion_logs_created` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Update transactions table to use decimal for price
ALTER TABLE `transactions` MODIFY COLUMN `price` decimal(10,2);

-- Update boutiqueTransactions table - already uses decimal in creation
