import { pgTable, integer, boolean, date, uniqueIndex, pgSchema, AnyPgColumn, index, foreignKey, serial, varchar, text, timestamp, pgEnum, decimal, primaryKey, unique } from "drizzle-orm/pg-core"
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

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	openId: varchar({ length: 64 }).unique(),
	name: text(),
	email: varchar({ length: 320 }).unique(),
	loginMethod: varchar({ length: 64 }),
	password: varchar("password", { length: 255 }),
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
},
(table) => [
	unique("users_openId_unique").on(table.openId),
	unique("users_email_unique").on(table.email),
]);


// Boutiques Table
export const boutiques = pgTable(
	"boutiques",
	{
		id: serial().primaryKey().notNull(),
		name: varchar({ length: 255 }).notNull(),
		slug: varchar({ length: 255 }).unique().notNull(),
		description: text(),
		// Map to actual database column names
		logo: varchar("logoUrl", { length: 500 }),           // DB column is 'logoUrl'
		ownerId: integer().notNull().references(() => users.id),
		website: varchar("websiteUrl", { length: 500 }),     // DB column is 'websiteUrl'
		instagram: varchar("instagramHandle", { length: 255 }), // DB column is 'instagramHandle'
		tiktok: varchar("tiktokHandle", { length: 255 }),    // DB column is 'tiktokHandle'
		facebook: varchar("facebookUrl", { length: 500 }),   // DB column is 'facebookUrl'
		whatsapp: varchar("whatsappNumber", { length: 255 }), // DB column is 'whatsappNumber'
		createdAt: timestamp({ mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
	},
	(table) => [
		index("idx_boutiques_owner").on(table.ownerId),
		index("idx_boutiques_slug").on(table.slug),
	]
);

export const boutiqueCredits = pgTable(
	"boutiquecredits",  // lowercase to match database
	{
		id: serial().primaryKey().notNull(),
		boutiqueId: integer().notNull().unique().references(() => boutiques.id),
		totalCredits: integer().default(0).notNull(),
		usedCredits: integer().default(0).notNull(),
		remainingCredits: integer().default(0).notNull(),
		expiresAt: timestamp({ mode: "string" }),
		createdAt: timestamp({ mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
	},
	(table) => [
		index("idx_boutique_credits_boutique").on(table.boutiqueId),
	]
);
// Boutique Settings Table - Match actual database columns
export const boutiqueSettings = pgTable(
  "boutiquesettings",
  {
    id: serial("id").primaryKey().notNull(),
    boutiqueId: integer("boutiqueId").notNull().unique().references(() => boutiques.id),
    brandingColor: varchar("brandingColor", { length: 7 }).default('#FF6B35'),
    customDomain: varchar("customDomain", { length: 255 }).default(''),
    enableSharing: integer("enableSharing").default(1),
    enableAnalytics: integer("enableAnalytics").default(1),
    webhookUrl: varchar("webhookUrl", { length: 500 }).default(''),
    createdAt: timestamp("createdAt").default(sql`CURRENT_TIMESTAMP`).notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    index("idx_boutique_settings_boutique").on(table.boutiqueId),
  ]
);

// Boutique Subscriptions Table
export const boutiqueSubscriptions = pgTable(
	"boutiquesubscriptions",
	{
		id: serial().primaryKey().notNull(),
			boutiqueId: integer().notNull().references(() => boutiques.id),
			subscription_type: varchar({ length: 50 }).notNull(),
		status: varchar({ length: 50 }).default("active").notNull(),
		createdAt: timestamp({ mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
	},
	(table) => [index("idx_boutique_subscriptions_boutique").on(table.boutiqueId)]
);

// Boutique Transactions Table
export const boutiqueTransactions = pgTable(
	"boutiquetransactions",
	{
		id: serial().primaryKey().notNull(),
			boutiqueId: integer().notNull().references(() => boutiques.id),
			transaction_type: varchar({ length: 50 }).notNull(),
		amount: decimal({ precision: 10, scale: 2 }).notNull(),
		status: varchar({ length: 50 }).default("pending").notNull(),
		createdAt: timestamp({ mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
	},
	(table) => [index("idx_boutique_transactions_boutique").on(table.boutiqueId)]
);

// Boutique Users Table
export const boutiqueUsers = pgTable(
	"boutiqueusers",
	{
		id: serial().primaryKey().notNull(),
			boutiqueId: integer().notNull().references(() => boutiques.id),
			userId: integer().notNull().references(() => users.id),
		role: varchar({ length: 50 }).default("staff").notNull(),
		createdAt: timestamp({ mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
	},
	(table) => [
		index("idx_boutique_users_boutique").on(table.boutiqueId),
		index("idx_boutique_users_user").on(table.userId),
	]
);

// Garments Table
export const garments = pgTable(
	"garments",
	{
		id: serial().primaryKey().notNull(),
			boutiqueId: integer().notNull().references(() => boutiques.id),
			name: varchar({ length: 255 }).notNull(),
			description: text(),
			image_url: varchar({ length: 500 }),
		createdAt: timestamp({ mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
	},
	(table) => [index("idx_garments_boutique").on(table.boutiqueId)]
);

// Products Table
export const products = pgTable(
	"products",
	{
		id: serial().primaryKey().notNull(),
			boutiqueId: integer().notNull().references(() => boutiques.id),
			name: varchar({ length: 255 }).notNull(),
			description: text(),
			price: decimal({ precision: 10, scale: 2 }).notNull(),
		image_url: varchar({ length: 500 }),
		createdAt: timestamp({ mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
	},
	(table) => [index("idx_products_boutique").on(table.boutiqueId)]
);

// User Credits Table
	export const userCredits = pgTable(
		"usercredits",
		{
			id: serial().primaryKey().notNull(),
			userId: integer().notNull().references(() => users.id),
			totalCredits: integer().default(0).notNull(),
			usedCredits: integer().default(0).notNull(),
			remainingCredits: integer().default(0).notNull(),
			createdAt: timestamp({ mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
			updatedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
		},
		(table) => [index("idx_user_credits_user").on(table.userId)]
	);

// Try-On Results Table
export const tryOnResults = pgTable(
	"tryOnResults",
	{
		id: serial().primaryKey().notNull(),
			userId: integer().notNull().references(() => users.id),
			garmentId: integer().references(() => garments.id),
		image_url: varchar({ length: 500 }).notNull(),
		watermarked_image_url: varchar({ length: 500 }),
		createdAt: timestamp({ mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
	},
	(table) => [
		index("idx_try_on_results_user").on(table.userId),
		index("idx_try_on_results_garment").on(table.garmentId),
	]
);

// Saved Outfits (Closet) Table
export const savedOutfits = pgTable(
	"savedOutfits",
	{
		id: serial().primaryKey().notNull(),
			userId: integer().notNull().references(() => users.id),
			tryOnResultId: integer().notNull().references(() => tryOnResults.id),
		title: varchar({ length: 255 }).notNull(),
		description: text(),
		watermarkedImageUrl: varchar({ length: 500 }).notNull(),
			isFavorite: integer().default(0).notNull(),
			comparisonNotes: text(),
			shareCount: integer().default(0).notNull(),
		tags: text().default("[]"),
		createdAt: timestamp({ mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
	},
	(table) => [
		index("idx_saved_outfits_user").on(table.userId),
		index("idx_saved_outfits_tryon").on(table.tryOnResultId),
		index("idx_saved_outfits_created").on(table.createdAt),
		index("idx_saved_outfits_favorite").on(table.isFavorite),
	]
);

// Remaining tables (abbreviated for brevity)
export const auditLogs = pgTable("auditLogs", {
	id: serial().primaryKey().notNull(),
	action: varchar({ length: 255 }).notNull(),
	createdAt: timestamp({ mode: "string" })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
});

	export const batchUploadFiles = pgTable("batchUploadFiles", {
		id: serial().primaryKey().notNull(),
		batchUploadId: integer(),
	file_name: varchar({ length: 255 }),
	createdAt: timestamp({ mode: "string" })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
});

	export const batchUploads = pgTable("batchUploads", {
		id: serial().primaryKey().notNull(),
		boutiqueId: integer(),
	status: varchar({ length: 50 }),
	createdAt: timestamp({ mode: "string" })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
});

export const deletionLogs = pgTable("deletionLogs", {
	id: serial().primaryKey().notNull(),
	entity_type: varchar({ length: 255 }),
	entity_id: integer(),
	createdAt: timestamp({ mode: "string" })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
});

	export const emailNotifications = pgTable("emailNotifications", {
		id: serial().primaryKey().notNull(),
		userId: integer(),
	email: varchar({ length: 255 }),
	subject: varchar({ length: 255 }),
	createdAt: timestamp({ mode: "string" })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
});

	export const favorites = pgTable("favorites", {
		id: serial().primaryKey().notNull(),
		userId: integer(),
		garmentId: integer(),
	createdAt: timestamp({ mode: "string" })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
});

	export const featureAccessLogs = pgTable("featureAccessLogs", {
		id: serial().primaryKey().notNull(),
		userId: integer(),
	feature_name: varchar({ length: 255 }),
	createdAt: timestamp({ mode: "string" })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
});

	export const inAppNotifications = pgTable("inAppNotifications", {
		id: serial().primaryKey().notNull(),
		userId: integer(),
	message: text(),
	createdAt: timestamp({ mode: "string" })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
});

export const paymentReconciliation = pgTable("paymentReconciliation", {
	id: serial().primaryKey().notNull(),
	transaction_id: varchar({ length: 255 }),
	status: varchar({ length: 50 }),
	createdAt: timestamp({ mode: "string" })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
});

	export const productSizeVariants = pgTable("productSizeVariants", {
		id: serial().primaryKey().notNull(),
		productId: integer(),
	size: varchar({ length: 50 }),
	createdAt: timestamp({ mode: "string" })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
});

	export const reviews = pgTable("reviews", {
		id: serial().primaryKey().notNull(),
		userId: integer(),
		productId: integer(),
	rating: integer(),
	comment: text(),
	createdAt: timestamp({ mode: "string" })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
});

	export const shopOrders = pgTable("shopOrders", {
		id: serial().primaryKey().notNull(),
		userId: integer(),
		boutiqueId: integer(),
		orderNumber: varchar({ length: 50 }).unique(),
		total_amount: decimal({ precision: 10, scale: 2 }),
		status: varchar({ length: 50 }).default("pending"),
		deliveryAddress: text(),
		customerPhone: varchar({ length: 20 }),
		createdAt: timestamp({ mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
	});

	export const subscriptionAuditLog = pgTable("subscriptionAuditLog", {
		id: serial().primaryKey().notNull(),
		subscriptionId: integer(),
	action: varchar({ length: 255 }),
	createdAt: timestamp({ mode: "string" })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
});

export const transactions = pgTable("transactions", {
	id: serial().primaryKey().notNull(),
	userId: integer().notNull().references(() => users.id),
	amount: decimal({ precision: 10, scale: 2 }).notNull(),
	status: varchar({ length: 50 }).notNull(),
	reason: varchar({ length: 255 }),
	createdAt: timestamp({ mode: "string" })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
});

export const tryOnUserMonthlyUsage = pgTable("userMonthlyUsage", {
		id: serial().primaryKey().notNull(),
		userId: integer().references(() => users.id),
	month: date(),
	usage_count: integer(),
	createdAt: timestamp({ mode: "string" })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
});

export const webhookAlerts = pgTable("webhookAlerts", {
	id: serial().primaryKey().notNull(),
	webhook_event_id: integer(),
	alert_message: text(),
	createdAt: timestamp({ mode: "string" })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
});

export const webhookEvents = pgTable("webhookEvents", {
	id: serial().primaryKey().notNull(),
	source: varchar({ length: 255 }),
	eventType: varchar({ length: 255 }),
	externalEventId: varchar({ length: 255 }),
	payload: text(),
	webhook_event_status: varchar({ length: 50 }),
	retryCount: integer().default(0),
	maxRetries: integer().default(3),
	lastRetryAt: timestamp({ mode: "string" }),
	nextRetryAt: timestamp({ mode: "string" }),
	error: text(),
	processedAt: timestamp({ mode: "string" }),
	createdAt: timestamp({ mode: "string" })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
	updatedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
});

export const drizzleMigrations = pgTable("__drizzle_migrations", {
	id: serial().primaryKey().notNull(),
	hash: varchar({ length: 255 }).notNull(),
	createdAt: timestamp({ mode: "string" })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
});


// Stub tables for compatibility - these need to be properly implemented
export const payouts = pgTable("payouts", {
	id: serial().primaryKey().notNull(),
	boutique_id: integer(),
	amount: decimal({ precision: 10, scale: 2 }),
	status: varchar({ length: 50 }),
	createdAt: timestamp({ mode: "string" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const payoutTransactions = pgTable("payoutTransactions", {
	id: serial().primaryKey().notNull(),
	payout_id: integer(),
	transaction_id: integer(),
	amount: decimal({ precision: 10, scale: 2 }),
	createdAt: timestamp({ mode: "string" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const payoutAuditLog = pgTable("payoutAuditLog", {
	id: serial().primaryKey().notNull(),
	payout_id: integer(),
	action: varchar({ length: 255 }),
	details: text(),
	createdAt: timestamp({ mode: "string" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const boutiqueBankAccounts = pgTable("boutiqueBankAccounts", {
	id: serial().primaryKey().notNull(),
	boutique_id: integer(),
	bank_name: varchar({ length: 255 }),
	account_number: varchar({ length: 255 }),
	createdAt: timestamp({ mode: "string" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const tryOnAnalytics = pgTable("tryOnAnalytics", {
	id: serial().primaryKey().notNull(),
	try_on_id: integer(),
	success: boolean(),
	duration: integer(),
	createdAt: timestamp({ mode: "string" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const analyticsSnapshots = pgTable("analyticsSnapshots", {
	id: serial().primaryKey().notNull(),
	snapshot_date: date(),
	total_try_ons: integer(),
	successful_try_ons: integer(),
	createdAt: timestamp({ mode: "string" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const apiKeys = pgTable("apiKeys", {
	id: serial().primaryKey().notNull(),
	key: varchar({ length: 255 }).unique(),
	name: varchar({ length: 255 }),
	boutique_id: integer(),
	createdAt: timestamp({ mode: "string" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const apiKeyLogs = pgTable("apiKeyLogs", {
	id: serial().primaryKey().notNull(),
	api_key_id: integer(),
	endpoint: varchar({ length: 255 }),
	status: integer(),
	createdAt: timestamp({ mode: "string" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const boutiqueVerifications = pgTable("boutiqueVerifications", {
	id: serial().primaryKey().notNull(),
	boutique_id: integer(),
	verification_status: varchar({ length: 50 }),
	createdAt: timestamp({ mode: "string" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const fraudFlags = pgTable("fraudFlags", {
	id: serial().primaryKey().notNull(),
	transaction_id: integer(),
	flag_reason: varchar({ length: 255 }),
	createdAt: timestamp({ mode: "string" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const notifications = pgTable("notifications", {
	id: serial().primaryKey().notNull(),
	user_id: integer(),
	title: varchar({ length: 255 }),
	message: text(),
	createdAt: timestamp({ mode: "string" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const onboardingStatus = pgTable("onboardingStatus", {
	id: serial().primaryKey().notNull(),
	user_id: integer(),
	step: varchar({ length: 50 }),
	completed: boolean(),
	createdAt: timestamp({ mode: "string" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const widgetAnalytics = pgTable("widgetAnalytics", {
	id: serial().primaryKey().notNull(),
	widget_id: integer(),
	views: integer(),
	clicks: integer(),
	createdAt: timestamp({ mode: "string" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const widgets = pgTable("widgets", {
	id: serial().primaryKey().notNull(),
	boutique_id: integer(),
	name: varchar({ length: 255 }),
	config: text(),
	createdAt: timestamp({ mode: "string" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});


// Outfit Voting Tables
export const outfitVotings = pgTable("outfitVotings", {
	id: serial().primaryKey().notNull(),
	userId: integer().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	outfitAImageUrl: text().notNull(),
	outfitBImageUrl: text().notNull(),
	outfitCImageUrl: text(),
	outfitATitle: varchar({ length: 100 }).default("Outfit A"),
	outfitBTitle: varchar({ length: 100 }).default("Outfit B"),
	outfitCTitle: varchar({ length: 100 }).default("Outfit C"),
	totalVotes: integer().default(0),
	isActive: boolean().default(true),
	expiresAt: timestamp({ mode: "string" }),
	createdAt: timestamp({ mode: "string" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
});

export const outfitVotes = pgTable("outfitVotes", {
	id: serial().primaryKey().notNull(),
	votingId: integer().notNull(),
	voterId: integer().notNull(),
	selectedOutfit: varchar({ length: 10 }).notNull(), // "A", "B", or "C"
	createdAt: timestamp({ mode: "string" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// Outfit Discovery Feed Tables
export const outfitDiscoveryFeed = pgTable("outfitDiscoveryFeed", {
	id: serial().primaryKey().notNull(),
	outfitId: integer().notNull(),
	userId: integer().notNull(),
	imageUrl: text().notNull(),
	title: varchar({ length: 255 }).notNull(),
	description: text(),
	tags: text(), // JSON array of tags
	likes: integer().default(0),
	views: integer().default(0),
	isPublic: boolean().default(true),
	createdAt: timestamp({ mode: "string" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
});

export const outfitLikes = pgTable("outfitLikes", {
	id: serial().primaryKey().notNull(),
	outfitId: integer().notNull(),
	userId: integer().notNull(),
	createdAt: timestamp({ mode: "string" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const outfitReports = pgTable("outfitReports", {
	id: serial().primaryKey().notNull(),
	outfitId: integer().notNull(),
	reportedBy: integer().notNull(),
	reason: varchar({ length: 255 }).notNull(),
	description: text(),
	status: varchar({ length: 50 }).default("pending"),
	createdAt: timestamp({ mode: "string" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
});


// Outfit Comments Table
export const outfitComments = pgTable("outfitComments", {
	id: serial().primaryKey().notNull(),
	outfitId: integer().notNull(),
	userId: integer().notNull(),
	comment: text().notNull(),
	likes: integer().default(0).notNull(),
	createdAt: timestamp({ mode: "string" }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
});


// Comment Notifications Table
export const commentNotifications = pgTable("commentNotifications", {
	id: serial("id").primaryKey(),
	userId: integer("userId").notNull().references(() => users.id),
	commentId: integer("commentId").notNull().references(() => outfitComments.id),
	outfitId: integer("outfitId").notNull().references(() => savedOutfits.id),
	notificationType: text("notificationType").notNull(), // 'new_comment', 'comment_reply', 'comment_like'
	isRead: boolean("isRead").default(false),
	createdAt: timestamp("createdAt").defaultNow(),
});

// Flagged Comments Table for Moderation
export const flaggedComments = pgTable("flaggedComments", {
	id: serial("id").primaryKey(),
	commentId: integer("commentId").notNull().references(() => outfitComments.id),
	reportedBy: integer("reportedBy").notNull().references(() => users.id),
	reason: text("reason").notNull(), // 'inappropriate', 'spam', 'offensive', 'other'
	description: text("description"),
	status: text("status").default("pending"), // 'pending', 'approved', 'rejected', 'deleted'
	moderatedBy: integer("moderatedBy").references(() => users.id),
	moderationNotes: text("moderationNotes"),
	createdAt: timestamp("createdAt").defaultNow(),
	updatedAt: timestamp("updatedAt").defaultNow(),
});

// Moderation Logs for Audit Trail
export const moderationLogs = pgTable("moderationLogs", {
	id: serial("id").primaryKey(),
	moderatorId: integer("moderatorId").notNull().references(() => users.id),
	action: text("action").notNull(), // 'flagged', 'approved', 'rejected', 'deleted'
	targetType: text("targetType").notNull(), // 'comment', 'outfit', 'user'
	targetId: integer("targetId").notNull(),
	reason: text("reason"),
	notes: text("notes"),
	createdAt: timestamp("createdAt").defaultNow(),
});


// User Follows Table
export const userFollows = pgTable("userFollows", {
	id: serial("id").primaryKey(),
	followerId: integer("followerId").notNull().references(() => users.id),
	followingId: integer("followingId").notNull().references(() => users.id),
	createdAt: timestamp("createdAt").defaultNow(),
});

// User Profiles Table
export const userProfiles = pgTable("userProfiles", {
	id: serial("id").primaryKey(),
	userId: integer("userId").notNull().unique().references(() => users.id),
	bio: text("bio"),
	avatar: text("avatar"),
	website: text("website"),
	location: text("location"),
	favoriteStyle: text("favoriteStyle"),
	followerCount: integer("followerCount").default(0),
	followingCount: integer("followingCount").default(0),
	outfitCount: integer("outfitCount").default(0),
	createdAt: timestamp("createdAt").defaultNow(),
	updatedAt: timestamp("updatedAt").defaultNow(),
});

// User Mentions Table
export const userMentions = pgTable("userMentions", {
	id: serial("id").primaryKey(),
	commentId: integer("commentId").notNull().references(() => outfitComments.id),
	mentionedUserId: integer("mentionedUserId").notNull().references(() => users.id),
	mentionedBy: integer("mentionedBy").notNull().references(() => users.id),
	isNotified: boolean("isNotified").default(false),
	createdAt: timestamp("createdAt").defaultNow(),
});

// Trending Hashtags Table
export const trendingHashtags = pgTable("trendingHashtags", {
	id: serial("id").primaryKey(),
	hashtag: text("hashtag").notNull().unique(),
	usageCount: integer("usageCount").default(1),
	trendingScore: decimal("trendingScore", { precision: 10, scale: 2 }).default("0"),
	isActive: boolean("isActive").default(true),
	createdAt: timestamp("createdAt").defaultNow(),
	updatedAt: timestamp("updatedAt").defaultNow(),
});

// Hashtag Usage Table
export const hashtagUsage = pgTable("hashtagUsage", {
	id: serial("id").primaryKey(),
	hashtagId: integer("hashtagId").notNull().references(() => trendingHashtags.id),
	outfitId: integer("outfitId").notNull().references(() => savedOutfits.id),
	createdAt: timestamp("createdAt").defaultNow(),
});


// Referral Links Table
export const referralLinks = pgTable("referralLinks", {
	id: serial("id").primaryKey(),
	userId: integer("userId").notNull().references(() => users.id),
	outfitId: integer("outfitId").notNull().references(() => savedOutfits.id),
	referralCode: varchar("referralCode", { length: 50 }).notNull().unique(),
	shortUrl: varchar("shortUrl", { length: 255 }),
	platform: varchar("platform", { length: 50 }), // 'whatsapp', 'instagram', 'tiktok', 'twitter'
	clicks: integer("clicks").default(0),
	signups: integer("signups").default(0),
	isActive: boolean("isActive").default(true),
	expiresAt: timestamp("expiresAt"),
	createdAt: timestamp("createdAt").defaultNow(),
	updatedAt: timestamp("updatedAt").defaultNow(),
}, (table) => [
	index("idx_referral_code").on(table.referralCode),
	index("idx_referral_user").on(table.userId),
	index("idx_referral_outfit").on(table.outfitId),
]);

// Referral Tracking Table
export const referralTracking = pgTable("referralTracking", {
	id: serial("id").primaryKey(),
	referralLinkId: integer("referralLinkId").notNull().references(() => referralLinks.id),
	referredUserId: integer("referredUserId").references(() => users.id),
	referrerUserId: integer("referrerUserId").notNull().references(() => users.id),
	platform: varchar("platform", { length: 50 }),
	ipAddress: varchar("ipAddress", { length: 45 }),
	userAgent: text("userAgent"),
	conversionStatus: varchar("conversionStatus", { length: 50 }).default("clicked"), // 'clicked', 'signed_up', 'completed_profile'
	convertedAt: timestamp("convertedAt"),
	createdAt: timestamp("createdAt").defaultNow(),
}, (table) => [
	index("idx_tracking_link").on(table.referralLinkId),
	index("idx_tracking_referred").on(table.referredUserId),
	index("idx_tracking_referrer").on(table.referrerUserId),
]);


// Affiliate Links Table (for StyleSwap internal tracking)
export const affiliateLinks = pgTable("affiliateLinks", {
	id: serial("id").primaryKey(),
	affiliateName: varchar("affiliateName", { length: 255 }).notNull(), // e.g., "Partner A", "Influencer B"
	affiliateCode: varchar("affiliateCode", { length: 50 }).notNull().unique(), // Unique tracking code
	description: text("description"), // Notes about the affiliate
	commissionRate: decimal("commissionRate", { precision: 5, scale: 2 }).default("7.50").notNull(), // 7.5% default
	isActive: boolean("isActive").default(true),
	createdAt: timestamp("createdAt").defaultNow(),
	updatedAt: timestamp("updatedAt").defaultNow(),
}, (table) => [
	index("idx_affiliate_code").on(table.affiliateCode),
	index("idx_affiliate_active").on(table.isActive),
]);

// Affiliate Tracking Table (tracks boutique sources)
export const affiliateTracking = pgTable("affiliateTracking", {
	id: serial("id").primaryKey(),
	affiliateLinkId: integer("affiliateLinkId").notNull().references(() => affiliateLinks.id),
	boutiqueId: integer("boutiqueId").notNull().references(() => boutiques.id),
	trackingToken: varchar("trackingToken", { length: 255 }).notNull().unique(), // Unique token for this boutique-affiliate pair
	source: varchar("source", { length: 50 }), // 'direct_link', 'email', 'social_media', etc.
	ipAddress: varchar("ipAddress", { length: 45 }),
	userAgent: text("userAgent"),
	isConverted: boolean("isConverted").default(false), // True when boutique makes first purchase
	convertedAt: timestamp("convertedAt"),
	createdAt: timestamp("createdAt").defaultNow(),
	updatedAt: timestamp("updatedAt").defaultNow(),
}, (table) => [
	index("idx_affiliate_tracking_link").on(table.affiliateLinkId),
	index("idx_affiliate_tracking_boutique").on(table.boutiqueId),
	index("idx_affiliate_tracking_token").on(table.trackingToken),
	index("idx_affiliate_tracking_converted").on(table.isConverted),
]);

	// Affiliate Commission Table (tracks 7.5% commission on clothing purchases)
export const affiliateCommissions = pgTable("affiliateCommissions", {
	id: serial("id").primaryKey(),
	affiliateTrackingId: integer("affiliateTrackingId").notNull().references(() => affiliateTracking.id),
	affiliateLinkId: integer("affiliateLinkId").notNull().references(() => affiliateLinks.id),
	boutiqueId: integer("boutiqueId").notNull().references(() => boutiques.id),
	clothingPurchaseAmount: decimal("clothingPurchaseAmount", { precision: 12, scale: 2 }).notNull(), // Total clothing purchase amount
	commissionAmount: decimal("commissionAmount", { precision: 12, scale: 2 }).notNull(), // 7.5% of purchase
	commissionRate: decimal("commissionRate", { precision: 5, scale: 2 }).default("7.50").notNull(), // Always 7.5%
	externalTransactionId: varchar("externalTransactionId", { length: 255 }), // Reference to external payment system
	status: varchar("status", { length: 50 }).default("pending").notNull(), // 'pending', 'approved', 'paid'
	paidAt: timestamp("paidAt"),
	notes: text("notes"),
	createdAt: timestamp("createdAt").defaultNow(),
	updatedAt: timestamp("updatedAt").defaultNow(),
}, (table) => [
	index("idx_commission_affiliate").on(table.affiliateLinkId),
	index("idx_commission_boutique").on(table.boutiqueId),
	index("idx_commission_status").on(table.status),
	index("idx_commission_tracking").on(table.affiliateTrackingId),
]);


// Push Notifications Table for all notification types
export const pushNotifications = pgTable("pushNotifications", {
	id: serial("id").primaryKey(),
	userId: integer("userId").notNull().references(() => users.id),
	notificationType: text("notificationType").notNull(), // 'poll_vote', 'outfit_comment', 'follow', 'mention', 'trending_outfit'
	title: varchar({ length: 255 }).notNull(),
	message: text().notNull(),
	relatedUserId: integer("relatedUserId").references(() => users.id), // User who triggered the notification
	relatedOutfitId: integer("relatedOutfitId").references(() => savedOutfits.id),
	relatedPollId: integer("relatedPollId").references(() => outfitVotings.id),
	isRead: boolean("isRead").default(false),
	actionUrl: text("actionUrl"), // URL to navigate to when notification is clicked
	createdAt: timestamp("createdAt").defaultNow().notNull(),
	updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => [
	index("idx_pushNotifications_userId").on(table.userId),
	index("idx_pushNotifications_notificationType").on(table.notificationType),
	index("idx_pushNotifications_isRead").on(table.isRead),
	index("idx_pushNotifications_createdAt").on(table.createdAt),
]);

// Push Notification Preferences Table
export const pushNotificationPreferences = pgTable("pushNotificationPreferences", {
	id: serial("id").primaryKey(),
	userId: integer("userId").notNull().unique().references(() => users.id),
	pollVotes: boolean("pollVotes").default(true),
	outfitComments: boolean("outfitComments").default(true),
	follows: boolean("follows").default(true),
	mentions: boolean("mentions").default(true),
	trendingOutfits: boolean("trendingOutfits").default(true),
	allNotifications: boolean("allNotifications").default(true), // Master toggle
	createdAt: timestamp("createdAt").defaultNow().notNull(),
	updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => [
	index("idx_pushNotificationPreferences_userId").on(table.userId),
]);

// Poll Vote Notifications (specific tracking)
export const pollVoteNotifications = pgTable("pollVoteNotifications", {
	id: serial("id").primaryKey(),
	pollId: integer("pollId").notNull().references(() => outfitVotings.id),
	voterId: integer("voterId").notNull().references(() => users.id),
	pollOwnerId: integer("pollOwnerId").notNull().references(() => users.id),
	selectedOutfit: varchar({ length: 10 }).notNull(),
	isNotified: boolean("isNotified").default(false),
	createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
	index("idx_pollVoteNotifications_pollId").on(table.pollId),
	index("idx_pollVoteNotifications_pollOwnerId").on(table.pollOwnerId),
]);

// Trending Outfits Notifications
export const trendingOutfitNotifications = pgTable("trendingOutfitNotifications", {
	id: serial("id").primaryKey(),
	outfitId: integer("outfitId").notNull().references(() => savedOutfits.id),
	userId: integer("userId").notNull().references(() => users.id),
	trendingRank: integer("trendingRank"), // Position in trending list
	engagementScore: integer("engagementScore"), // Votes, comments, shares combined
	isNotified: boolean("isNotified").default(false),
	createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
	index("idx_trendingOutfitNotifications_userId").on(table.userId),
	index("idx_trendingOutfitNotifications_outfitId").on(table.outfitId),
]);

// Follow Notifications
export const followNotifications = pgTable("followNotifications", {
	id: serial("id").primaryKey(),
	followerId: integer("followerId").notNull().references(() => users.id),
	followingId: integer("followingId").notNull().references(() => users.id),
	isNotified: boolean("isNotified").default(false),
	createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
	index("idx_followNotifications_followingId").on(table.followingId),
	index("idx_followNotifications_followerId").on(table.followerId),
]);

// Mention Notifications
export const mentionNotifications = pgTable("mentionNotifications", {
	id: serial("id").primaryKey(),
	mentionedUserId: integer("mentionedUserId").notNull().references(() => users.id),
	mentionedByUserId: integer("mentionedByUserId").notNull().references(() => users.id),
	contextType: text("contextType").notNull(), // 'comment', 'outfit_description', 'caption'
	contextId: integer("contextId").notNull(), // ID of the comment or outfit
	message: text("message"),
	isNotified: boolean("isNotified").default(false),
	createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [
	index("idx_mentionNotifications_mentionedUserId").on(table.mentionedUserId),
	index("idx_mentionNotifications_mentionedByUserId").on(table.mentionedByUserId),
]);


// Coupon Codes Table
export const couponCodes = pgTable(
	"couponCodes",
	{
		id: serial().primaryKey().notNull(),
		code: varchar({ length: 50 }).unique().notNull(),
		description: text(),
		creditsValue: decimal({ precision: 10, scale: 2 }).notNull(),
		maxUses: integer().notNull(),
		currentUses: integer().default(0).notNull(),
		expiresAt: timestamp({ mode: "string" }),
		isActive: boolean().default(true).notNull(),
		createdAt: timestamp({ mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
	},
	(table) => [
		index("idx_coupon_codes_code").on(table.code),
		index("idx_coupon_codes_active").on(table.isActive),
	]
);

// Coupon Redemptions Table
export const couponRedemptions = pgTable(
	"couponRedemptions",
	{
		id: serial().primaryKey().notNull(),
			couponId: integer().notNull().references(() => couponCodes.id),
			userId: integer().notNull().references(() => users.id),
		redeemedAt: timestamp({ mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
	},
	(table) => [
		index("idx_coupon_redemptions_coupon").on(table.couponId),
		index("idx_coupon_redemptions_user").on(table.userId),
		uniqueIndex("idx_coupon_redemptions_unique").on(table.couponId, table.userId),
	]
);


// App Registrations Table
export const appRegistrations = pgTable(
	"appRegistrations",
	{
		id: serial().primaryKey().notNull(),
		appName: varchar({ length: 255 }).notNull(),
		companyName: varchar({ length: 255 }).notNull(),
		email: varchar({ length: 255 }).notNull(),
		website: varchar({ length: 500 }).notNull(),
		platformType: varchar({ length: 50 }).notNull(),
		description: text().notNull(),
		apiKey: varchar({ length: 255 }).unique().notNull(),
		apiSecret: varchar({ length: 255 }).unique().notNull(),
		status: varchar({ length: 50 }).default("active").notNull(), // active, suspended, revoked
		isLiveMode: boolean().default(false).notNull(),
		requestsCount: integer().default(0).notNull(),
		lastRequestAt: timestamp({ mode: "string" }),
		createdAt: timestamp({ mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
	},
	(table) => [
		index("idx_app_registrations_email").on(table.email),
		index("idx_app_registrations_apiKey").on(table.apiKey),
		index("idx_app_registrations_status").on(table.status),
	]
);


// Type exports for insert operations
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;
export type InsertTryOnResult = typeof tryOnResults.$inferInsert;
export type SelectTryOnResult = typeof tryOnResults.$inferSelect;
