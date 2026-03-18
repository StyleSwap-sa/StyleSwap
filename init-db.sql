-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
    "id" SERIAL PRIMARY KEY NOT NULL,
    "openId" VARCHAR(255) UNIQUE NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "loginMethod" VARCHAR(50) NOT NULL DEFAULT 'oauth',
    "user_role" VARCHAR(50) NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSignedIn" TIMESTAMP,
    "phone" VARCHAR(20),
    "user_type" VARCHAR(50) DEFAULT 'individual',
    "currentBoutiqueId" INTEGER,
    "freeTrialUsed" BOOLEAN DEFAULT false,
    "freeTrialUsedAt" TIMESTAMP,
    "freeTrialExpiresAt" TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users"("email");
CREATE INDEX IF NOT EXISTS "idx_users_openId" ON "users"("openId");

-- Create boutiques table
CREATE TABLE IF NOT EXISTS "boutiques" (
    "id" SERIAL PRIMARY KEY NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) UNIQUE NOT NULL,
    "description" TEXT,
    "logo" VARCHAR(500),
    "ownerId" INTEGER NOT NULL REFERENCES "users"("id"),
    "website" VARCHAR(500),
    "instagram" VARCHAR(255),
    "tiktok" VARCHAR(255),
    "facebook" VARCHAR(255),
    "whatsapp" VARCHAR(255),
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_boutiques_owner" ON "boutiques"("ownerId");
CREATE INDEX IF NOT EXISTS "idx_boutiques_slug" ON "boutiques"("slug");

-- Create boutiqueCredits table
CREATE TABLE IF NOT EXISTS "boutiqueCredits" (
    "id" SERIAL PRIMARY KEY NOT NULL,
    "boutiqueId" INTEGER NOT NULL REFERENCES "boutiques"("id"),
    "credits" DECIMAL(10, 2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_boutique_credits_boutique" ON "boutiqueCredits"("boutiqueId");

-- Create boutiqueSettings table
CREATE TABLE IF NOT EXISTS "boutiqueSettings" (
    "id" SERIAL PRIMARY KEY NOT NULL,
    "boutiqueId" INTEGER NOT NULL REFERENCES "boutiques"("id"),
    "setting_key" VARCHAR(255) NOT NULL,
    "setting_value" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_boutique_settings_boutique" ON "boutiqueSettings"("boutiqueId");
CREATE INDEX IF NOT EXISTS "idx_boutique_settings_key" ON "boutiqueSettings"("setting_key");

-- Create garments table
CREATE TABLE IF NOT EXISTS "garments" (
    "id" SERIAL PRIMARY KEY NOT NULL,
    "boutiqueId" INTEGER NOT NULL REFERENCES "boutiques"("id"),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(100),
    "image_url" VARCHAR(500),
    "status" VARCHAR(50) DEFAULT 'active',
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_garments_boutique" ON "garments"("boutiqueId");

-- Create tryOnResults table
CREATE TABLE IF NOT EXISTS "tryOnResults" (
    "id" SERIAL PRIMARY KEY NOT NULL,
    "userId" INTEGER NOT NULL REFERENCES "users"("id"),
    "garmentId" INTEGER NOT NULL REFERENCES "garments"("id"),
    "originalImage" VARCHAR(500),
    "resultImage" VARCHAR(500),
    "shareToken" VARCHAR(255) UNIQUE,
    "shareCount" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_tryOn_user" ON "tryOnResults"("userId");
CREATE INDEX IF NOT EXISTS "idx_tryOn_garment" ON "tryOnResults"("garmentId");
CREATE INDEX IF NOT EXISTS "idx_tryOn_shareToken" ON "tryOnResults"("shareToken");

-- Create shopOrders table
CREATE TABLE IF NOT EXISTS "shopOrders" (
    "id" SERIAL PRIMARY KEY NOT NULL,
    "customerId" INTEGER NOT NULL REFERENCES "users"("id"),
    "boutiqueId" INTEGER NOT NULL REFERENCES "boutiques"("id"),
    "status" VARCHAR(50) DEFAULT 'pending',
    "amount" DECIMAL(10, 2),
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_orders_customer" ON "shopOrders"("customerId");
CREATE INDEX IF NOT EXISTS "idx_orders_boutique" ON "shopOrders"("boutiqueId");

-- Create boutiqueTransactions table
CREATE TABLE IF NOT EXISTS "boutiqueTransactions" (
    "id" SERIAL PRIMARY KEY NOT NULL,
    "boutiqueId" INTEGER NOT NULL REFERENCES "boutiques"("id"),
    "type" VARCHAR(50),
    "amount" DECIMAL(10, 2),
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_transactions_boutique" ON "boutiqueTransactions"("boutiqueId");

-- Create webhookEvents table
CREATE TABLE IF NOT EXISTS "webhookEvents" (
    "id" SERIAL PRIMARY KEY NOT NULL,
    "source" VARCHAR(100),
    "eventType" VARCHAR(100),
    "externalEventId" VARCHAR(255),
    "payload" TEXT,
    "webhook_event_status" VARCHAR(50),
    "retryCount" INTEGER DEFAULT 0,
    "maxRetries" INTEGER DEFAULT 3,
    "lastRetryAt" TIMESTAMP,
    "nextRetryAt" TIMESTAMP,
    "error" TEXT,
    "processedAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_webhook_events_status" ON "webhookEvents"("webhook_event_status");
CREATE INDEX IF NOT EXISTS "idx_webhook_events_externalId" ON "webhookEvents"("externalEventId");

-- Create analyticsSnapshots table
CREATE TABLE IF NOT EXISTS "analyticsSnapshots" (
    "id" SERIAL PRIMARY KEY NOT NULL,
    "boutiqueId" INTEGER REFERENCES "boutiques"("id"),
    "snapshot_date" DATE,
    "total_try_ons" INTEGER DEFAULT 0,
    "successful_try_ons" INTEGER DEFAULT 0,
    "average_processing_time" DECIMAL(10, 2),
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_analytics_boutique" ON "analyticsSnapshots"("boutiqueId");
CREATE INDEX IF NOT EXISTS "idx_analytics_date" ON "analyticsSnapshots"("snapshot_date");
