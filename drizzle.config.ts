import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

// PostgreSQL dialect configuration
// Updated to use PostgreSQL instead of MySQL for Render deployment
export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString + "?sslmode=require",
    // PostgreSQL connection via environment variable with SSL enabled
  },
});
