import { pgTable, pgSchema, index, foreignKey, serial, varchar, text, timestamp, pgEnum, decimal, primaryKey, unique } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

// PostgreSQL Enums
export const auditLogsActionEnum = pgEnum('audit_logs_action', ['create', 'update', 'delete', 'export', 'import']);
export const boutiqueStatusEnum = pgEnum('boutique_status', ['active', 'suspended', 'inactive']);
export const boutiqueTransactionTypeEnum = pgEnum('boutique_transaction_type', ['purchase', 'usage', 'refund', 'adjustment']);
export const boutiqueTransactionStatusEnum = pgEnum('boutique_transaction_status', ['pending', 'completed', 'failed']);
export const boutiqueUserRoleEnum = pgEnum('boutique_user_role', ['owner', 'manager', 'staff']);
export const emailNotificationTypeEnum = pgEnum('email_notification_type', ['purchase_confirmation', 'try_on_complete', 'credits_expiring', 'promotional']);
export const emailNotificationStatusEnum = pgEnum('email_notification_status', ['pending', 'sent', 'failed', 'bounced']);
export const productSizeEnum = pgEnum('product_size', ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']);
export const fitAdjustmentEnum = pgEnum('fit_adjustment', ['tight', 'perfect', 'loose']);
export const transactionTypeEnum = pgEnum('transaction_type', ['purchase', 'usage', 'refund', 'adjustment', 'order_payment', 'order_confirmation']);
export const transactionStatusEnum = pgEnum('transaction_status', ['pending', 'completed', 'failed']);
export const flowTypeEnum = pgEnum('flow_type', ['b2c', 'b2b']);
export const userRoleEnum = pgEnum('user_role', ['user', 'admin', 'merchant']);
export const userTypeEnum = pgEnum('user_type', ['customer', 'merchant', 'admin']);
export const webhookAlertTypeEnum = pgEnum('webhook_alert_type', ['webhook_failed', 'webhook_max_retries', 'payment_unmatched', 'payment_mismatch']);
export const webhookAlertSeverityEnum = pgEnum('webhook_alert_severity', ['low', 'medium', 'high', 'critical']);
export const webhookEventStatusEnum = pgEnum('webhook_event_status', ['pending', 'processing', 'success', 'failed', 'retrying']);
export const batchUploadStatusEnum = pgEnum('batch_upload_status', ['pending', 'processing', 'completed', 'failed']);
export const batchUploadFileStatusEnum = pgEnum('batch_upload_file_status', ['pending', 'uploaded', 'failed']);
export const clothingTypeEnum = pgEnum('clothing_type', ['upper', 'lower', 'combo', 'full']);
export const paymentReconciliationStatusEnum = pgEnum('payment_reconciliation_status', ['matched', 'unmatched', 'duplicate', 'mismatch']);
export const shopOrderStatusEnum = pgEnum('shop_order_status', ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']);
export const bankAccountTypeEnum = pgEnum('bank_account_type', ['checking', 'savings']);
export const payoutStatusEnum = pgEnum('payout_status', ['pending', 'processing', 'completed', 'failed']);
export const apiKeyStatusEnum = pgEnum('api_key_status', ['active', 'revoked']);
export const payoutAuditActorTypeEnum = pgEnum('payout_audit_actor_type', ['system', 'admin', 'boutique']);

export const auditLogs = pgTable("auditLogs", {
	id: serial().primaryKey().notNull(),
	boutiqueId: serial().references(() => boutiques.id),
	userId: serial().references(() => users.id),
	action: varchar({ length: 255 }).notNull(),
	entityType: varchar({ length: 100 }),
	entityId: serial(),
	changes: text(),
	ipAddress: varchar({ length: 45 }),
	userAgent: text(),
	status: varchar({ length: 50 }),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
},
(table) => [
	index("idx_audit_logs_boutique").on(table.boutiqueId),
	index("idx_audit_logs_user").on(table.userId),
	index("idx_audit_logs_action").on(table.action),
	index("idx_audit_logs_created").on(table.createdAt),
]);

export const boutiqueCredits = pgTable("boutiqueCredits", {
	id: serial().primaryKey().notNull(),
	boutiqueId: serial().notNull().references(() => boutiques.id),
	totalCredits: serial().default(0).notNull(),
	usedCredits: serial().default(0).notNull(),
	remainingCredits: serial().default(0).notNull(),
	expiresAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	unique("boutiqueCredits_boutiqueId_unique").on(table.boutiqueId),
	index("idx_boutique_credits_boutique").on(table.boutiqueId),
]);

export const boutiqueSettings = pgTable("boutiqueSettings", {
	id: serial().primaryKey().notNull(),
	boutiqueId: serial().notNull().references(() => boutiques.id),
	brandingColor: varchar({ length: 7 }).default('#FF6B35'),
	customDomain: varchar({ length: 255 }).default(''),
	enableSharing: serial().default(1),
	enableAnalytics: serial().default(1),
	webhookUrl: varchar({ length: 500 }).default(''),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	unique("boutiqueSettings_boutiqueId_unique").on(table.boutiqueId),
]);

export const boutiqueTransactions = pgTable("boutiqueTransactions", {
	id: serial().primaryKey().notNull(),
	boutiqueId: serial().notNull().references(() => boutiques.id),
	type: boutiqueTransactionTypeEnum('boutique_transaction_type').notNull(),
	amount: serial().notNull(),
	price: decimal({ precision: 10, scale: 2 }),
	currency: varchar({ length: 3 }).default('ZAR'),
	productId: serial(),
	fitRoomRequestId: varchar({ length: 255 }),
	initiatedBy: serial().references(() => users.id),
	description: text(),
	status: boutiqueTransactionStatusEnum('boutique_transaction_status').default('pending').notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("idx_boutique_transactions_boutique").on(table.boutiqueId),
	index("idx_boutique_transactions_type").on(table.type),
	index("idx_boutique_transactions_created").on(table.createdAt),
]);

export const boutiqueUsers = pgTable("boutiqueUsers", {
	id: serial().primaryKey().notNull(),
	boutiqueId: serial().notNull().references(() => boutiques.id),
	userId: serial().notNull().references(() => users.id),
	role: boutiqueUserRoleEnum('boutique_user_role').default('staff').notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
},
(table) => [
	index("idx_boutique_user_boutique").on(table.boutiqueId),
	index("idx_boutique_user_user").on(table.userId),
]);

export const boutiques = pgTable("boutiques", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	slug: varchar({ length: 255 }).notNull().unique(),
	description: text(),
	logoUrl: varchar({ length: 500 }),
	websiteUrl: varchar({ length: 500 }),
	ownerId: serial().notNull().references(() => users.id),
	status: boutiqueStatusEnum('boutique_status').default('active').notNull(),
	isVerified: serial().default(0).notNull(),
	verificationToken: varchar({ length: 255 }),
	verificationTokenExpiry: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	instagramHandle: varchar({ length: 255 }),
	tiktokHandle: varchar({ length: 255 }),
	facebookUrl: varchar({ length: 500 }),
	whatsappNumber: varchar({ length: 20 }),
	},
	(table) => [
		index("idx_boutique_owner").on(table.ownerId),
		index("idx_boutique_status").on(table.status),
	]);

export const deletionLogs = pgTable("deletionLogs", {
	id: serial().primaryKey().notNull(),
	boutiqueId: serial().references(() => boutiques.id),
	userId: serial().references(() => users.id),
	dataType: varchar({ length: 100 }).notNull(),
	dataId: serial(),
	reason: varchar({ length: 255 }),
	deletedBy: serial().references(() => users.id),
	deletionHash: varchar({ length: 255 }),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
},
(table) => [
	index("idx_deletion_logs_boutique").on(table.boutiqueId),
	index("idx_deletion_logs_created").on(table.createdAt),
]);

export const emailNotifications = pgTable("emailNotifications", {
	id: serial().primaryKey().notNull(),
	userId: serial().notNull().references(() => users.id),
	type: emailNotificationTypeEnum('email_notification_type').notNull(),
	subject: varchar({ length: 255 }).notNull(),
	recipientEmail: varchar({ length: 320 }).notNull(),
	status: emailNotificationStatusEnum('email_notification_status').default('pending').notNull(),
	sentAt: timestamp({ mode: 'string' }),
	failureReason: text(),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("idx_email_notifications_user").on(table.userId),
]);

export const favorites = pgTable("favorites", {
	id: serial().primaryKey().notNull(),
	userId: serial().notNull().references(() => users.id),
	garmentId: serial().notNull().references(() => garments.id),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
},
(table) => [
	index("idx_favorites_user").on(table.userId),
]);

export const garments = pgTable("garments", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	category: varchar({ length: 100 }).notNull(),
	imageUrl: varchar({ length: 500 }).notNull(),
	price: varchar({ length: 20 }),
	currency: varchar({ length: 3 }).default('ZAR'),
	isActive: serial().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("idx_garments_active").on(table.isActive),
]);

export const paymentReconciliation = pgTable("paymentReconciliation", {
	id: serial().primaryKey().notNull(),
	yocoTransactionId: varchar({ length: 255 }).notNull().unique(),
	yocoAmount: decimal({ precision: 10, scale: 2 }).notNull(),
	yocoCurrency: varchar({ length: 3 }).default('ZAR').notNull(),
	yocoStatus: varchar({ length: 50 }).notNull(),
	yocoTimestamp: timestamp({ mode: 'string' }).notNull(),
	styleswapUserId: serial().references(() => users.id),
	styleswapTransactionId: serial().references(() => transactions.id),
	styleswapCreditsAdded: serial(),
	styleswapTimestamp: timestamp({ mode: 'string' }),
	reconciliationStatus: paymentReconciliationStatusEnum('payment_reconciliation_status').default('unmatched').notNull(),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	});

export const productSizeVariants = pgTable("productSizeVariants", {
	id: serial().primaryKey().notNull(),
	productId: serial().notNull().references(() => products.id),
	size: productSizeEnum('product_size').notNull(),
	stock: serial().default(0).notNull(),
	isAvailable: serial().default(1).notNull(),
	fitAdjustment: fitAdjustmentEnum('fit_adjustment').default('perfect').notNull(),
	sizeScalingFactor: decimal({ precision: 3, scale: 2 }).default('1.00').notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("idx_product_size_product").on(table.productId),
	index("idx_product_size_available").on(table.isAvailable),
]);

export const products = pgTable("products", {
	id: serial().primaryKey().notNull(),
	boutiqueId: serial().notNull().references(() => boutiques.id),
	name: varchar({ length: 255 }).notNull(),
	sku: varchar({ length: 100 }),
	description: text(),
	category: varchar({ length: 100 }).notNull(),
	imageUrl: varchar({ length: 500 }).notNull(),
	price: decimal({ precision: 10, scale: 2 }),
	currency: varchar({ length: 3 }).default('ZAR'),
	isActive: serial().default(1).notNull(),
	hasSizeVariants: serial().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("idx_products_boutique").on(table.boutiqueId),
	index("idx_products_active").on(table.isActive),
]);

export const transactions = pgTable("transactions", {
	id: serial().primaryKey().notNull(),
	userId: serial().notNull().references(() => users.id),
	type: transactionTypeEnum('transaction_type').notNull(),
	amount: serial().notNull(),
	price: decimal({ precision: 10, scale: 2 }),
	currency: varchar({ length: 3 }).default('ZAR'),
	fitRoomOrderId: varchar({ length: 255 }),
	description: text(),
	status: transactionStatusEnum('transaction_status').default('pending').notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("idx_transactions_user").on(table.userId),
	index("idx_transactions_type").on(table.type),
]);

export const tryOnResults = pgTable("tryOnResults", {
	id: serial().primaryKey().notNull(),
	userId: serial().notNull().references(() => users.id),
	garmentId: serial().references(() => garments.id),
	userPhotoUrl: varchar({ length: 500 }).notNull(),
	resultImageUrl: varchar({ length: 500 }),
	shareToken: varchar({ length: 255 }).unique(),
	shareCount: serial().default(0),
	isPublic: serial().default(0),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	boutiqueId: serial().references(() => boutiques.id),
	productId: serial().references(() => products.id),
	fitRoomTaskId: varchar({ length: 255 }),
	fitRoomRequestId: varchar({ length: 255 }),
	flowType: flowTypeEnum('flow_type').default('b2c').notNull(),
		selectedSize: productSizeEnum('product_size').default('M'),
	sizeScalingFactor: decimal({ precision: 3, scale: 2 }).default('1.00'),
	},
	(table) => [
		index("idx_tryon_boutique").on(table.boutiqueId),
		index("idx_tryon_user").on(table.userId),
		index("idx_tryon_flowtype").on(table.flowType),
		index("idx_tryon_size").on(table.selectedSize),
	]);

export const userCredits = pgTable("userCredits", {
	id: serial().primaryKey().notNull(),
	userId: serial().notNull().references(() => users.id),
	totalCredits: serial().default(0).notNull(),
	usedCredits: serial().default(0).notNull(),
	remainingCredits: serial().default(0).notNull(),
	expiresAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("idx_user_credits_user").on(table.userId),
]);

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	openId: varchar({ length: 64 }).unique(),
	name: text(),
	email: varchar({ length: 320 }).unique(),
	loginMethod: varchar({ length: 64 }),
	role: userRoleEnum('user_role').default('user').notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	lastSignedIn: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	phone: varchar({ length: 20 }),
	userType: userTypeEnum('user_type').default('customer').notNull(),
	currentBoutiqueId: serial(),
	freeTrialUsed: serial().default(0).notNull(),
	freeTrialUsedAt: timestamp({ mode: 'string' }),
	freeTrialExpiresAt: timestamp({ mode: 'string' }),
	});

export const webhookAlerts = pgTable("webhookAlerts", {
	id: serial().primaryKey().notNull(),
	alertType: webhookAlertTypeEnum('webhook_alert_type').notNull(),
	severity: webhookAlertSeverityEnum('webhook_alert_severity').default('medium').notNull(),
	webhookEventId: serial().references(() => webhookEvents.id),
	paymentReconciliationId: serial().references(() => paymentReconciliation.id),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	isResolved: serial().default(0).notNull(),
	resolvedAt: timestamp({ mode: 'string' }),
	resolvedBy: serial().references(() => users.id),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
});

export const webhookEvents = pgTable("webhookEvents", {
	id: serial().primaryKey().notNull(),
	source: varchar({ length: 50 }).notNull(),
	eventType: varchar({ length: 100 }).notNull(),
	externalEventId: varchar({ length: 255 }).notNull().unique(),
	payload: text().notNull(),
	status: webhookEventStatusEnum('webhook_event_status').default('pending').notNull(),
	retryCount: serial().default(0).notNull(),
	maxRetries: serial().default(3).notNull(),
	lastRetryAt: timestamp({ mode: 'string' }),
	nextRetryAt: timestamp({ mode: 'string' }),
	error: text(),
	processedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	});

export const reviews = pgTable("reviews", {
	id: serial().primaryKey().notNull(),
	userId: serial().notNull().references(() => users.id),
	tryOnResultId: serial().references(() => tryOnResults.id),
	rating: serial().notNull(),
	comment: text(),
	helpful: serial().default(0),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("idx_reviews_user").on(table.userId),
	index("idx_reviews_try_on").on(table.tryOnResultId),
	index("idx_reviews_rating").on(table.rating),
	index("idx_reviews_created").on(table.createdAt),
]);

export const batchUploads = pgTable("batchUploads", {
	id: serial().primaryKey().notNull(),
	boutiqueId: serial().notNull().references(() => boutiques.id),
	userId: serial().notNull().references(() => users.id),
	uploadName: varchar({ length: 255 }).notNull(),
	totalFiles: serial().notNull().default(0),
	successfulFiles: serial().notNull().default(0),
	failedFiles: serial().notNull().default(0),
	status: batchUploadStatusEnum('batch_upload_status').default('pending').notNull(),
	errorMessage: text(),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	completedAt: timestamp({ mode: 'string' }),
},
(table) => [
	index("idx_batch_uploads_boutique").on(table.boutiqueId),
	index("idx_batch_uploads_user").on(table.userId),
	index("idx_batch_uploads_status").on(table.status),
	index("idx_batch_uploads_created").on(table.createdAt),
]);

export const batchUploadFiles = pgTable("batchUploadFiles", {
	id: serial().primaryKey().notNull(),
	batchUploadId: serial().notNull().references(() => batchUploads.id),
	fileName: varchar({ length: 255 }).notNull(),
	fileSize: serial().notNull(),
	fileUrl: text().notNull(),
	clothingType: clothingTypeEnum('clothing_type').notNull(),
	status: batchUploadFileStatusEnum('batch_upload_file_status').default('pending').notNull(),
	errorMessage: text(),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
},
(table) => [
	index("idx_batch_files_batch").on(table.batchUploadId),
	index("idx_batch_files_status").on(table.status),
	index("idx_batch_files_created").on(table.createdAt),
]);

export const tryOnAnalytics = pgTable("tryOnAnalytics", {
	id: serial().primaryKey().notNull(),
	tryOnResultId: serial().references(() => tryOnResults.id),
	successRate: serial(),
	processingTime: serial(),
	imageQuality: varchar({ length: 50 }),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
},
(table) => [
	index("idx_try_on_analytics_result").on(table.tryOnResultId),
	index("idx_try_on_analytics_created").on(table.createdAt),
]);

export const analyticsSnapshots = pgTable("analyticsSnapshots", {
	id: serial().primaryKey().notNull(),
	date: varchar({ length: 50 }).notNull(),
	successRate: serial(),
	totalTryOns: serial(),
	averageProcessingTime: serial(),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
},
(table) => [
	index("idx_analytics_snapshots_date").on(table.date),
	index("idx_analytics_snapshots_created").on(table.createdAt),
]);

export const shopOrders = pgTable("shopOrders", {
	id: serial().primaryKey().notNull(),
	orderNumber: varchar({ length: 50 }).notNull().unique(),
	customerId: serial().notNull().references(() => users.id),
	boutiqueId: serial().notNull().references(() => boutiques.id),
	productId: serial(),
	quantity: serial().default(1).notNull(),
	size: varchar({ length: 50 }),
	color: varchar({ length: 50 }),
	amount: decimal({ precision: 10, scale: 2 }).notNull(),
	status: shopOrderStatusEnum('shop_order_status').default('pending').notNull(),
	deliveryAddress: text(),
	customerPhone: varchar({ length: 20 }),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("idx_shopOrders_customer").on(table.customerId),
	index("idx_shopOrders_boutique").on(table.boutiqueId),
	index("idx_shopOrders_status").on(table.status),
	index("idx_shopOrders_created").on(table.createdAt),
	unique("idx_shopOrders_number").on(table.orderNumber),
]);

export const boutiqueBankAccounts = pgTable("boutiqueBankAccounts", {
	id: serial().primaryKey().notNull(),
	boutiqueId: serial().notNull().unique().references(() => boutiques.id),
	accountHolderName: varchar({ length: 255 }).notNull(),
	bankName: varchar({ length: 255 }).notNull(),
	accountNumber: varchar({ length: 50 }).notNull(),
	branchCode: varchar({ length: 20 }),
	accountType: bankAccountTypeEnum('bank_account_type').default('checking').notNull(),
	isVerified: serial().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("idx_bank_accounts_boutique").on(table.boutiqueId),
]);

export const payouts = pgTable("payouts", {
	id: serial().primaryKey().notNull(),
	boutiqueId: serial().notNull().references(() => boutiques.id),
	payoutPeriodStart: varchar({ length: 10 }).notNull(),
	payoutPeriodEnd: varchar({ length: 10 }).notNull(),
	totalRevenue: decimal({ precision: 10, scale: 2 }).default('0').notNull(),
	yokoFees: decimal({ precision: 10, scale: 2 }).default('0').notNull(),
	boutiquePayout: decimal({ precision: 10, scale: 2 }).default('0').notNull(),
	status: payoutStatusEnum('payout_status').default('pending').notNull(),
	payoutDate: timestamp({ mode: 'string' }),
	referenceNumber: varchar({ length: 100 }).unique(),
	notes: text(),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("idx_payouts_boutique_status").on(table.boutiqueId, table.status),
	index("idx_payouts_date").on(table.payoutDate),
]);

export const payoutTransactions = pgTable("payoutTransactions", {
	id: serial().primaryKey().notNull(),
	payoutId: serial().notNull().references(() => payouts.id),
	orderId: serial().notNull().references(() => shopOrders.id),
	orderAmount: decimal({ precision: 10, scale: 2 }).notNull(),
	yokoFee: decimal({ precision: 10, scale: 2 }).notNull(),
	boutiqueShare: decimal({ precision: 10, scale: 2 }).notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
},
(table) => [
	index("idx_payout_transactions_payout").on(table.payoutId),
	index("idx_payout_transactions_order").on(table.orderId),
]);

export const payoutAuditLog = pgTable("payoutAuditLog", {
	id: serial().primaryKey().notNull(),
	payoutId: serial().references(() => payouts.id),
	action: varchar({ length: 100 }).notNull(),
	oldStatus: varchar({ length: 50 }),
	newStatus: varchar({ length: 50 }),
	actorId: serial(),
	actorType: payoutAuditActorTypeEnum('payout_audit_actor_type').default('system').notNull(),
	details: text(),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
},
(table) => [
	index("idx_audit_log_payout").on(table.payoutId),
	index("idx_audit_log_created").on(table.createdAt),
]);

export const apiKeys = pgTable("apiKeys", {
	id: serial().primaryKey().notNull(),
	boutiqueId: serial().notNull().references(() => boutiques.id),
	name: varchar({ length: 255 }).notNull(),
	key: varchar({ length: 255 }).notNull().unique(),
	maskedKey: varchar({ length: 50 }).notNull(),
	status: apiKeyStatusEnum('api_key_status').default('active').notNull(),
	requestsCount: serial().default(0).notNull(),
	lastUsedAt: timestamp({ mode: 'string' }),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	revokedAt: timestamp({ mode: 'string' }),
},
(table) => [
	index("idx_api_keys_boutique").on(table.boutiqueId),
	unique("idx_api_keys_key").on(table.key),
	index("idx_api_keys_status").on(table.status),
	index("idx_api_keys_created").on(table.createdAt),
]);

export const apiKeyLogs = pgTable("apiKeyLogs", {
	id: serial().primaryKey().notNull(),
	apiKeyId: serial().notNull().references(() => apiKeys.id),
	method: varchar({ length: 10 }).notNull(),
	endpoint: varchar({ length: 500 }).notNull(),
	statusCode: serial().notNull(),
	responseTime: serial(),
	ipAddress: varchar({ length: 45 }),
	userAgent: text(),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
},
(table) => [
	index("idx_api_key_logs_key").on(table.apiKeyId),
	index("idx_api_key_logs_created").on(table.createdAt),
	index("idx_api_key_logs_endpoint").on(table.endpoint),
]);

export const widgets = pgTable("widgets", {
	id: varchar({ length: 255 }).primaryKey().notNull(),
	boutiqueId: varchar({ length: 255 }).notNull().references(() => boutiques.id),
	name: varchar({ length: 255 }).notNull(),
	isActive: serial().default(1).notNull(),
	primaryColor: varchar({ length: 7 }).default('#FF6B35').notNull(),
	accentColor: varchar({ length: 7 }).default('#004E89').notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("idx_widgets_boutique").on(table.boutiqueId),
	index("idx_widgets_active").on(table.isActive),
	index("idx_widgets_created").on(table.createdAt),
]);

export const widgetAnalytics = pgTable("widgetAnalytics", {
	id: varchar({ length: 255 }).primaryKey().notNull(),
	widgetId: varchar({ length: 255 }).notNull().references(() => widgets.id),
	eventType: varchar({ length: 50 }).notNull(),
	data: text(),
	timestamp: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
},
(table) => [
	index("idx_widget_analytics_widget").on(table.widgetId),
	index("idx_widget_analytics_event").on(table.eventType),
	index("idx_widget_analytics_timestamp").on(table.timestamp),
]);

// Saved Outfits (Closet) Table
export const savedOutfits = pgTable("savedOutfits", {
	id: serial().primaryKey().notNull(),
	userId: serial().notNull().references(() => users.id),
	tryOnResultId: serial().notNull().references(() => tryOnResults.id),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	watermarkedImageUrl: varchar({ length: 500 }).notNull(),
	isFavorite: serial().default(0).notNull(),
	comparisonNotes: text(),
	shareCount: serial().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
},
(table) => [
	index("idx_saved_outfits_user").on(table.userId),
	index("idx_saved_outfits_tryon").on(table.tryOnResultId),
	index("idx_saved_outfits_created").on(table.createdAt),
	index("idx_saved_outfits_favorite").on(table.isFavorite),
]);
