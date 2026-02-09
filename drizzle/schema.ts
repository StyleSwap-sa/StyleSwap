import { mysqlTable, mysqlSchema, AnyMySqlColumn, index, foreignKey, int, varchar, text, timestamp, mysqlEnum, decimal } from "drizzle-orm/mysql-core"
import { sql } from "drizzle-orm"

export const auditLogs = mysqlTable("auditLogs", {
	id: int().autoincrement().notNull(),
	boutiqueId: int().references(() => boutiques.id),
	userId: int().references(() => users.id),
	action: varchar({ length: 255 }).notNull(),
	entityType: varchar({ length: 100 }),
	entityId: int(),
	changes: text(),
	ipAddress: varchar({ length: 45 }),
	userAgent: text(),
	status: varchar({ length: 50 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_audit_logs_boutique").on(table.boutiqueId),
	index("idx_audit_logs_user").on(table.userId),
	index("idx_audit_logs_action").on(table.action),
	index("idx_audit_logs_created").on(table.createdAt),
]);

export const boutiqueCredits = mysqlTable("boutiqueCredits", {
	id: int().autoincrement().notNull(),
	boutiqueId: int().notNull().references(() => boutiques.id),
	totalCredits: int().default(0).notNull(),
	usedCredits: int().default(0).notNull(),
	remainingCredits: int().default(0).notNull(),
	expiresAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("boutiqueCredits_boutiqueId_unique").on(table.boutiqueId),
	index("idx_boutique_credits_boutique").on(table.boutiqueId),
]);

export const boutiqueSettings = mysqlTable("boutiqueSettings", {
	id: int().autoincrement().notNull(),
	boutiqueId: int().notNull().references(() => boutiques.id),
	brandingColor: varchar({ length: 7 }).default('#FF6B35'),
	customDomain: varchar({ length: 255 }).default(''),
	enableSharing: int().default(1),
	enableAnalytics: int().default(1),
	webhookUrl: varchar({ length: 500 }).default(''),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("boutiqueSettings_boutiqueId_unique").on(table.boutiqueId),
]);

export const boutiqueTransactions = mysqlTable("boutiqueTransactions", {
	id: int().autoincrement().notNull(),
	boutiqueId: int().notNull().references(() => boutiques.id),
	type: mysqlEnum(['purchase','usage','refund','adjustment']).notNull(),
	amount: int().notNull(),
	price: decimal({ precision: 10, scale: 2 }),
	currency: varchar({ length: 3 }).default('ZAR'),
	productId: int(),
	fitRoomRequestId: varchar({ length: 255 }),
	initiatedBy: int().references(() => users.id),
	description: text(),
	status: mysqlEnum(['pending','completed','failed']).default('pending').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_boutique_transactions_boutique").on(table.boutiqueId),
	index("idx_boutique_transactions_type").on(table.type),
	index("idx_boutique_transactions_created").on(table.createdAt),
]);

export const boutiqueUsers = mysqlTable("boutiqueUsers", {
	id: int().autoincrement().notNull(),
	boutiqueId: int().notNull().references(() => boutiques.id),
	userId: int().notNull().references(() => users.id),
	role: mysqlEnum(['owner','manager','staff']).default('staff').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_boutique_user_boutique").on(table.boutiqueId),
	index("idx_boutique_user_user").on(table.userId),
]);

export const boutiques = mysqlTable("boutiques", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }).notNull(),
	description: text(),
	logoUrl: varchar({ length: 500 }),
	websiteUrl: varchar({ length: 500 }),
	ownerId: int().notNull().references(() => users.id),
	status: mysqlEnum(['active','suspended','inactive']).default('active').notNull(),
	isVerified: int().default(0).notNull(),
	verificationToken: varchar({ length: 255 }),
	verificationTokenExpiry: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	instagramHandle: varchar({ length: 255 }),
	tiktokHandle: varchar({ length: 255 }),
	facebookUrl: varchar({ length: 500 }),
	whatsappNumber: varchar({ length: 20 }),
},
(table) => [
	index("boutiques_slug_unique").on(table.slug),
	index("idx_boutique_owner").on(table.ownerId),
	index("idx_boutique_status").on(table.status),
]);

export const deletionLogs = mysqlTable("deletionLogs", {
	id: int().autoincrement().notNull(),
	boutiqueId: int().references(() => boutiques.id),
	userId: int().references(() => users.id),
	dataType: varchar({ length: 100 }).notNull(),
	dataId: int(),
	reason: varchar({ length: 255 }),
	deletedBy: int().references(() => users.id),
	deletionHash: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_deletion_logs_boutique").on(table.boutiqueId),
	index("idx_deletion_logs_created").on(table.createdAt),
]);

export const emailNotifications = mysqlTable("emailNotifications", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id),
	type: mysqlEnum(['purchase_confirmation','try_on_complete','credits_expiring','promotional']).notNull(),
	subject: varchar({ length: 255 }).notNull(),
	recipientEmail: varchar({ length: 320 }).notNull(),
	status: mysqlEnum(['pending','sent','failed','bounced']).default('pending').notNull(),
	sentAt: timestamp({ mode: 'string' }),
	failureReason: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_email_notifications_user").on(table.userId),
]);

export const favorites = mysqlTable("favorites", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id),
	garmentId: int().notNull().references(() => garments.id),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_favorites_user").on(table.userId),
]);

export const garments = mysqlTable("garments", {
	id: int().autoincrement().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	category: varchar({ length: 100 }).notNull(),
	imageUrl: varchar({ length: 500 }).notNull(),
	price: varchar({ length: 20 }),
	currency: varchar({ length: 3 }).default('ZAR'),
	isActive: int().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_garments_active").on(table.isActive),
]);

export const paymentReconciliation = mysqlTable("paymentReconciliation", {
	id: int().autoincrement().notNull(),
	yocoTransactionId: varchar({ length: 255 }).notNull(),
	yocoAmount: decimal({ precision: 10, scale: 2 }).notNull(),
	yocoCurrency: varchar({ length: 3 }).default('ZAR').notNull(),
	yocoStatus: varchar({ length: 50 }).notNull(),
	yocoTimestamp: timestamp({ mode: 'string' }).notNull(),
	styleswapUserId: int().references(() => users.id),
	styleswapTransactionId: int().references(() => transactions.id),
	styleswapCreditsAdded: int(),
	styleswapTimestamp: timestamp({ mode: 'string' }),
	reconciliationStatus: mysqlEnum(['matched','unmatched','duplicate','mismatch']).default('unmatched').notNull(),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("paymentReconciliation_yocoTransactionId_unique").on(table.yocoTransactionId),
]);

export const productSizeVariants = mysqlTable("productSizeVariants", {
	id: int().autoincrement().notNull(),
	productId: int().notNull().references(() => products.id),
	size: mysqlEnum(['XS','S','M','L','XL','XXL','XXXL']).notNull(),
		stock: int().default(0).notNull(),
		isAvailable: int().default(1).notNull(),
		fitAdjustment: mysqlEnum(['tight','perfect','loose']).default('perfect').notNull(),
		sizeScalingFactor: decimal({ precision: 3, scale: 2 }).default('1.00').notNull(),
		createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_product_size_product").on(table.productId),
	index("idx_product_size_available").on(table.isAvailable),
]);

export const products = mysqlTable("products", {
	id: int().autoincrement().notNull(),
	boutiqueId: int().notNull().references(() => boutiques.id),
	name: varchar({ length: 255 }).notNull(),
	sku: varchar({ length: 100 }),
	description: text(),
	category: varchar({ length: 100 }).notNull(),
	imageUrl: varchar({ length: 500 }).notNull(),
	price: decimal({ precision: 10, scale: 2 }),
	currency: varchar({ length: 3 }).default('ZAR'),
	isActive: int().default(1).notNull(),
	hasSizeVariants: int().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_products_boutique").on(table.boutiqueId),
	index("idx_products_active").on(table.isActive),
]);

export const transactions = mysqlTable("transactions", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id),
	type: mysqlEnum(['purchase','usage','refund']).notNull(),
	amount: int().notNull(),
	price: decimal({ precision: 10, scale: 2 }),
	currency: varchar({ length: 3 }).default('ZAR'),
	fitRoomOrderId: varchar({ length: 255 }),
	description: text(),
	status: mysqlEnum(['pending','completed','failed']).default('pending').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_transactions_user").on(table.userId),
	index("idx_transactions_type").on(table.type),
]);

export const tryOnResults = mysqlTable("tryOnResults", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id),
	garmentId: int().references(() => garments.id),
	userPhotoUrl: varchar({ length: 500 }).notNull(),
	resultImageUrl: varchar({ length: 500 }),
	shareToken: varchar({ length: 255 }),
	shareCount: int().default(0),
	isPublic: int().default(0),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	boutiqueId: int().references(() => boutiques.id),
	productId: int().references(() => products.id),
	fitRoomTaskId: varchar({ length: 255 }),
	fitRoomRequestId: varchar({ length: 255 }),
		flowType: mysqlEnum(['b2c','b2b']).default('b2c').notNull(),
		selectedSize: mysqlEnum(['XS','S','M','L','XL','XXL','XXXL']),
		sizeScalingFactor: decimal({ precision: 3, scale: 2 }).default('1.00'),
	},
	(table) => [
		index("tryOnResults_shareToken_unique").on(table.shareToken),
	index("idx_tryon_boutique").on(table.boutiqueId),
	index("idx_tryon_user").on(table.userId),
		index("idx_tryon_flowtype").on(table.flowType),
		index("idx_tryon_size").on(table.selectedSize),
	]);

export const userCredits = mysqlTable("userCredits", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id),
	totalCredits: int().default(0).notNull(),
	usedCredits: int().default(0).notNull(),
	remainingCredits: int().default(0).notNull(),
	expiresAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_user_credits_user").on(table.userId),
]);

export const users = mysqlTable("users", {
	id: int().autoincrement().notNull(),
	openId: varchar({ length: 64 }).notNull(),
	name: text(),
	email: varchar({ length: 320 }),
	loginMethod: varchar({ length: 64 }),
	role: mysqlEnum(['user','admin','merchant']).default('user').notNull(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
	lastSignedIn: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	phone: varchar({ length: 20 }),
	userType: mysqlEnum(['customer','merchant','admin']).default('customer').notNull(),
	currentBoutiqueId: int(),
},
	(table) => [
		index("users_openId_unique").on(table.openId),
		index("users_email_unique").on(table.email),
	]);

// Helper function to create unique constraint in SQL
export const emailUniqueConstraint = `
	ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
`;

export const webhookAlerts = mysqlTable("webhookAlerts", {
	id: int().autoincrement().notNull(),
	alertType: mysqlEnum(['webhook_failed','webhook_max_retries','payment_unmatched','payment_mismatch']).notNull(),
	severity: mysqlEnum(['low','medium','high','critical']).default('medium').notNull(),
	webhookEventId: int().references(() => webhookEvents.id),
	paymentReconciliationId: int().references(() => paymentReconciliation.id),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	isResolved: int().default(0).notNull(),
	resolvedAt: timestamp({ mode: 'string' }),
	resolvedBy: int().references(() => users.id),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
});

export const webhookEvents = mysqlTable("webhookEvents", {
	id: int().autoincrement().notNull(),
	source: varchar({ length: 50 }).notNull(),
	eventType: varchar({ length: 100 }).notNull(),
	externalEventId: varchar({ length: 255 }).notNull(),
	payload: text().notNull(),
	status: mysqlEnum(['pending','processing','success','failed','retrying']).default('pending').notNull(),
	retryCount: int().default(0).notNull(),
	maxRetries: int().default(3).notNull(),
	lastRetryAt: timestamp({ mode: 'string' }),
	nextRetryAt: timestamp({ mode: 'string' }),
	error: text(),
	processedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("webhookEvents_externalEventId_unique").on(table.externalEventId),
]);

// Customer Reviews Table
export const reviews = mysqlTable("reviews", {
	id: int().autoincrement().notNull(),
	userId: int().notNull().references(() => users.id),
	tryOnResultId: int().references(() => tryOnResults.id),
	rating: int().notNull(),
	comment: text(),
	helpful: int().default(0),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	index("idx_reviews_user").on(table.userId),
	index("idx_reviews_try_on").on(table.tryOnResultId),
	index("idx_reviews_rating").on(table.rating),
	index("idx_reviews_created").on(table.createdAt),
]);

// Batch Upload History for Boutiques
export const batchUploads = mysqlTable("batchUploads", {
	id: int().autoincrement().notNull(),
	boutiqueId: int().notNull().references(() => boutiques.id),
	userId: int().notNull().references(() => users.id),
	uploadName: varchar({ length: 255 }).notNull(),
	totalFiles: int().notNull().default(0),
	successfulFiles: int().notNull().default(0),
	failedFiles: int().notNull().default(0),
	status: mysqlEnum(['pending', 'processing', 'completed', 'failed']).default('pending').notNull(),
	errorMessage: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	completedAt: timestamp({ mode: 'string' }),
},
(table) => [
	index("idx_batch_uploads_boutique").on(table.boutiqueId),
	index("idx_batch_uploads_user").on(table.userId),
	index("idx_batch_uploads_status").on(table.status),
	index("idx_batch_uploads_created").on(table.createdAt),
]);

// Batch Upload Files (individual files in a batch)
export const batchUploadFiles = mysqlTable("batchUploadFiles", {
	id: int().autoincrement().notNull(),
	batchUploadId: int().notNull().references(() => batchUploads.id),
	fileName: varchar({ length: 255 }).notNull(),
	fileSize: int().notNull(),
	fileUrl: text().notNull(),
	clothingType: mysqlEnum(['upper', 'lower', 'combo', 'full']).notNull(),
	status: mysqlEnum(['pending', 'uploaded', 'failed']).default('pending').notNull(),
	errorMessage: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_batch_files_batch").on(table.batchUploadId),
	index("idx_batch_files_status").on(table.status),
	index("idx_batch_files_created").on(table.createdAt),
]);

// Analytics Tables
export const tryOnAnalytics = mysqlTable("tryOnAnalytics", {
	id: int().autoincrement().notNull(),
	tryOnResultId: int().references(() => tryOnResults.id),
	successRate: int(),
	processingTime: int(),
	imageQuality: varchar({ length: 50 }),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_try_on_analytics_result").on(table.tryOnResultId),
	index("idx_try_on_analytics_created").on(table.createdAt),
]);

export const analyticsSnapshots = mysqlTable("analyticsSnapshots", {
	id: int().autoincrement().notNull(),
	date: varchar({ length: 50 }).notNull(),
	successRate: int(),
	totalTryOns: int(),
	averageProcessingTime: int(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
},
(table) => [
	index("idx_analytics_snapshots_date").on(table.date),
	index("idx_analytics_snapshots_created").on(table.createdAt),
]);





// Phase 1: Simple Order Tracking Table (Isolated)
export const shopOrders = mysqlTable("shopOrders", {
	id: int().autoincrement().notNull().primaryKey(),
	orderNumber: varchar({ length: 50 }).notNull().unique(),
	customerId: int().notNull().references(() => users.id),
	boutiqueId: int().notNull().references(() => boutiques.id),
	productId: int(),
	quantity: int().default(1).notNull(),
	size: varchar({ length: 50 }),
	color: varchar({ length: 50 }),
	amount: decimal({ precision: 10, scale: 2 }).notNull(),
	status: mysqlEnum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).default('pending').notNull(),
	deliveryAddress: text(),
	customerPhone: varchar({ length: 20 }),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
},
(table) => [
	{ primaryKey: table.id },
	index("idx_shopOrders_customer").on(table.customerId),
	index("idx_shopOrders_boutique").on(table.boutiqueId),
	index("idx_shopOrders_status").on(table.status),
	index("idx_shopOrders_created").on(table.createdAt),
	index("idx_shopOrders_number").on(table.orderNumber),
]);
