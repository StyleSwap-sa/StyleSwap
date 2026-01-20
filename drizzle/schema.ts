import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, index, foreignKey } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "merchant"]).default("user").notNull(),
  userType: mysqlEnum("userType", ["customer", "merchant", "admin"]).default("customer").notNull(),
  currentBoutiqueId: int("currentBoutiqueId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Boutiques/Merchants table - represents independent boutique accounts
 */
export const boutiques = mysqlTable("boutiques", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  logoUrl: varchar("logoUrl", { length: 500 }),
  websiteUrl: varchar("websiteUrl", { length: 500 }),
  instagramHandle: varchar("instagramHandle", { length: 255 }),
  tiktokHandle: varchar("tiktokHandle", { length: 255 }),
  facebookUrl: varchar("facebookUrl", { length: 500 }),
  whatsappNumber: varchar("whatsappNumber", { length: 20 }),
  ownerId: int("ownerId").notNull(),
  status: mysqlEnum("status", ["active", "suspended", "inactive"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  foreignKey({ columns: [table.ownerId], foreignColumns: [users.id] }),
  index("idx_boutique_owner").on(table.ownerId),
  index("idx_boutique_status").on(table.status),
]);

export type Boutique = typeof boutiques.$inferSelect;
export type InsertBoutique = typeof boutiques.$inferInsert;

/**
 * Boutique Users/Staff - team members with roles
 */
export const boutiqueUsers = mysqlTable("boutiqueUsers", {
  id: int("id").autoincrement().primaryKey(),
  boutiqueId: int("boutiqueId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["owner", "manager", "staff"]).default("staff").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  foreignKey({ columns: [table.boutiqueId], foreignColumns: [boutiques.id] }),
  foreignKey({ columns: [table.userId], foreignColumns: [users.id] }),
  index("idx_boutique_user_boutique").on(table.boutiqueId),
  index("idx_boutique_user_user").on(table.userId),
]);

export type BoutiqueUser = typeof boutiqueUsers.$inferSelect;
export type InsertBoutiqueUser = typeof boutiqueUsers.$inferInsert;

/**
 * Boutique Settings - configuration per boutique
 */
export const boutiqueSettings = mysqlTable("boutiqueSettings", {
  id: int("id").autoincrement().primaryKey(),
  boutiqueId: int("boutiqueId").notNull().unique(),
  brandingColor: varchar("brandingColor", { length: 7 }).default("#FF6B35"),
  customDomain: varchar("customDomain", { length: 255 }).default(""),
  enableSharing: int("enableSharing").default(1).notNull(),
  enableAnalytics: int("enableAnalytics").default(1).notNull(),
  webhookUrl: varchar("webhookUrl", { length: 500 }).default(""),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  foreignKey({ columns: [table.boutiqueId], foreignColumns: [boutiques.id] }),
]);

export type BoutiqueSettings = typeof boutiqueSettings.$inferSelect;
export type InsertBoutiqueSettings = typeof boutiqueSettings.$inferInsert;

/**
 * Boutique Credits - credit balance per boutique
 */
export const boutiqueCredits = mysqlTable("boutiqueCredits", {
  id: int("id").autoincrement().primaryKey(),
  boutiqueId: int("boutiqueId").notNull().unique(),
  totalCredits: int("totalCredits").default(0).notNull(),
  usedCredits: int("usedCredits").default(0).notNull(),
  remainingCredits: int("remainingCredits").default(0).notNull(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  foreignKey({ columns: [table.boutiqueId], foreignColumns: [boutiques.id] }),
  index("idx_boutique_credits_boutique").on(table.boutiqueId),
]);

export type BoutiqueCredits = typeof boutiqueCredits.$inferSelect;
export type InsertBoutiqueCredits = typeof boutiqueCredits.$inferInsert;

/**
 * User credits table - tracks try-on credits purchased by individual users (B2C)
 */
export const userCredits = mysqlTable("userCredits", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  totalCredits: int("totalCredits").default(0).notNull(),
  usedCredits: int("usedCredits").default(0).notNull(),
  remainingCredits: int("remainingCredits").default(0).notNull(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  foreignKey({ columns: [table.userId], foreignColumns: [users.id] }),
  index("idx_user_credits_user").on(table.userId),
]);

export type UserCredits = typeof userCredits.$inferSelect;
export type InsertUserCredits = typeof userCredits.$inferInsert;

/**
 * Boutique Transactions - tracks usage and purchases per boutique
 */
export const boutiqueTransactions = mysqlTable("boutiqueTransactions", {
  id: int("id").autoincrement().primaryKey(),
  boutiqueId: int("boutiqueId").notNull(),
  type: mysqlEnum("type", ["purchase", "usage", "refund", "adjustment"]).notNull(),
  amount: int("amount").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("ZAR"),
  productId: int("productId"),
  fitRoomRequestId: varchar("fitRoomRequestId", { length: 255 }),
  initiatedBy: int("initiatedBy"),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "completed", "failed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  foreignKey({ columns: [table.boutiqueId], foreignColumns: [boutiques.id] }),
  foreignKey({ columns: [table.initiatedBy], foreignColumns: [users.id] }),
  index("idx_boutique_transactions_boutique").on(table.boutiqueId),
  index("idx_boutique_transactions_type").on(table.type),
  index("idx_boutique_transactions_created").on(table.createdAt),
]);

export type BoutiqueTransaction = typeof boutiqueTransactions.$inferSelect;
export type InsertBoutiqueTransaction = typeof boutiqueTransactions.$inferInsert;

/**
 * Transactions table - tracks all credit purchases and usage (B2C)
 */
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["purchase", "usage", "refund"]).notNull(),
  amount: int("amount").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("ZAR"),
  fitRoomOrderId: varchar("fitRoomOrderId", { length: 255 }),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "completed", "failed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  foreignKey({ columns: [table.userId], foreignColumns: [users.id] }),
  index("idx_transactions_user").on(table.userId),
  index("idx_transactions_type").on(table.type),
]);

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Products table - per-boutique product catalogue (replaces garments)
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  boutiqueId: int("boutiqueId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  sku: varchar("sku", { length: 100 }),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(),
  imageUrl: varchar("imageUrl", { length: 500 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }),
  currency: varchar("currency", { length: 3 }).default("ZAR"),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  foreignKey({ columns: [table.boutiqueId], foreignColumns: [boutiques.id] }),
  index("idx_products_boutique").on(table.boutiqueId),
  index("idx_products_active").on(table.isActive),
]);

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Garments catalog table - stores available garments for try-ons (B2C, kept for backwards compatibility)
 */
export const garments = mysqlTable("garments", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(),
  imageUrl: varchar("imageUrl", { length: 500 }).notNull(),
  price: varchar("price", { length: 20 }),
  currency: varchar("currency", { length: 3 }).default("ZAR"),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  index("idx_garments_active").on(table.isActive),
]);

export type Garment = typeof garments.$inferSelect;
export type InsertGarment = typeof garments.$inferInsert;

/**
 * Try-on results table - stores generated virtual try-on images
 */
export const tryOnResults = mysqlTable("tryOnResults", {
  id: int("id").autoincrement().primaryKey(),
  boutiqueId: int("boutiqueId"),
  userId: int("userId").notNull(),
  productId: int("productId"),
  garmentId: int("garmentId"),
  userPhotoUrl: varchar("userPhotoUrl", { length: 500 }).notNull(),
  resultImageUrl: varchar("resultImageUrl", { length: 500 }),
  fitRoomTaskId: varchar("fitRoomTaskId", { length: 255 }),
  fitRoomRequestId: varchar("fitRoomRequestId", { length: 255 }),
  shareToken: varchar("shareToken", { length: 255 }).unique(),
  shareCount: int("shareCount").default(0),
  isPublic: int("isPublic").default(0),
  flowType: mysqlEnum("flowType", ["b2c", "b2b"]).default("b2c").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  foreignKey({ columns: [table.boutiqueId], foreignColumns: [boutiques.id] }),
  foreignKey({ columns: [table.userId], foreignColumns: [users.id] }),
  foreignKey({ columns: [table.productId], foreignColumns: [products.id] }),
  foreignKey({ columns: [table.garmentId], foreignColumns: [garments.id] }),
  index("idx_tryon_boutique").on(table.boutiqueId),
  index("idx_tryon_user").on(table.userId),
  index("idx_tryon_flowtype").on(table.flowType),
]);

export type TryOnResult = typeof tryOnResults.$inferSelect;
export type InsertTryOnResult = typeof tryOnResults.$inferInsert;

/**
 * Email notifications table - stores notification history
 */
export const emailNotifications = mysqlTable("emailNotifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["purchase_confirmation", "try_on_complete", "credits_expiring", "promotional"]).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  status: mysqlEnum("status", ["pending", "sent", "failed", "bounced"]).default("pending").notNull(),
  sentAt: timestamp("sentAt"),
  failureReason: text("failureReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  foreignKey({ columns: [table.userId], foreignColumns: [users.id] }),
  index("idx_email_notifications_user").on(table.userId),
]);

export type EmailNotification = typeof emailNotifications.$inferSelect;
export type InsertEmailNotification = typeof emailNotifications.$inferInsert;

/**
 * Favorites table - tracks user favorite garments (B2C)
 */
export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  garmentId: int("garmentId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  foreignKey({ columns: [table.userId], foreignColumns: [users.id] }),
  foreignKey({ columns: [table.garmentId], foreignColumns: [garments.id] }),
  index("idx_favorites_user").on(table.userId),
]);

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;

/**
 * Audit Logs - immutable audit trail for compliance (POPIA)
 */
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  boutiqueId: int("boutiqueId"),
  userId: int("userId"),
  action: varchar("action", { length: 255 }).notNull(),
  entityType: varchar("entityType", { length: 100 }),
  entityId: int("entityId"),
  changes: text("changes"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  status: varchar("status", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  foreignKey({ columns: [table.boutiqueId], foreignColumns: [boutiques.id] }),
  foreignKey({ columns: [table.userId], foreignColumns: [users.id] }),
  index("idx_audit_logs_boutique").on(table.boutiqueId),
  index("idx_audit_logs_user").on(table.userId),
  index("idx_audit_logs_action").on(table.action),
  index("idx_audit_logs_created").on(table.createdAt),
]);

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * Data Deletion Logs - track deleted data for compliance (POPIA 7-day auto-deletion)
 */
export const deletionLogs = mysqlTable("deletionLogs", {
  id: int("id").autoincrement().primaryKey(),
  boutiqueId: int("boutiqueId"),
  userId: int("userId"),
  dataType: varchar("dataType", { length: 100 }).notNull(),
  dataId: int("dataId"),
  reason: varchar("reason", { length: 255 }),
  deletedBy: int("deletedBy"),
  deletionHash: varchar("deletionHash", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
  foreignKey({ columns: [table.boutiqueId], foreignColumns: [boutiques.id] }),
  foreignKey({ columns: [table.userId], foreignColumns: [users.id] }),
  foreignKey({ columns: [table.deletedBy], foreignColumns: [users.id] }),
  index("idx_deletion_logs_boutique").on(table.boutiqueId),
  index("idx_deletion_logs_created").on(table.createdAt),
]);

export type DeletionLog = typeof deletionLogs.$inferSelect;
export type InsertDeletionLog = typeof deletionLogs.$inferInsert;
