-- Create required enums for users table
CREATE TYPE user_role AS ENUM ('user', 'admin', 'merchant');
CREATE TYPE user_type AS ENUM ('customer', 'merchant', 'admin');

-- Create users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY NOT NULL,
  "openId" VARCHAR(64) UNIQUE,
  name TEXT,
  email VARCHAR(320) UNIQUE,
  "loginMethod" VARCHAR(64),
  role user_role DEFAULT 'user' NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "lastSignedIn" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  phone VARCHAR(20),
  "userType" user_type DEFAULT 'customer' NOT NULL,
  "currentBoutiqueId" INTEGER,
  "freeTrialUsed" INTEGER DEFAULT 0 NOT NULL,
  "freeTrialUsedAt" TIMESTAMP,
  "freeTrialExpiresAt" TIMESTAMP
);

-- Create unique constraints
ALTER TABLE users ADD CONSTRAINT users_openId_unique UNIQUE ("openId");
ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);

-- Create indexes
CREATE INDEX idx_users_openId ON users("openId");
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created ON users("createdAt");
