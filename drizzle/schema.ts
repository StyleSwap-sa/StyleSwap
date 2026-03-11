import { sql } from "drizzle-orm";
import {
	index,
	integer,
	pgTable,
	serial,
	text,
	timestamp,
	varchar,
	boolean,
	decimal,
	date,
	uniqueIndex,
} from "drizzle-orm/pg-core";

// Users Table
export const users = pgTable(
	"users",
	{
		id: serial().primaryKey().notNull(),
		openId: varchar({ length: 255 }).unique().notNull(),
		name: varchar({ length: 255 }).notNull(),
		email: varchar({ length: 255 }).unique().notNull(),
		loginMethod: varchar({ length: 50 }).default("oauth").notNull(),
		user_role: varchar({ length: 50 }).default("user").notNull(),
		createdAt: timestamp({ mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
		lastSignedIn: timestamp({ mode: "string" }),
		phone: varchar({ length: 20 }),
		user_type: varchar({ length: 50 }).default("individual"),
		currentBoutiqueId: integer(),
		freeTrialUsed: boolean().default(false),
		freeTrialUsedAt: timestamp({ mode: "string" }),
		freeTrialExpiresAt: timestamp({ mode: "string" }),
	},
	(table) => [
		index("idx_users_email").on(table.email),
		index("idx_users_openId").on(table.openId),
	]
);

// Boutiques Table
export const boutiques = pgTable(
	"boutiques",
	{
		id: serial().primaryKey().notNull(),
		name: varchar({ length: 255 }).notNull(),
		slug: varchar({ length: 255 }).unique().notNull(),
		description: text(),
		logo: varchar({ length: 500 }),
		ownerId: serial().notNull().references(() => users.id),
		website: varchar({ length: 500 }),
		instagram: varchar({ length: 255 }),
		tiktok: varchar({ length: 255 }),
		facebook: varchar({ length: 255 }),
		whatsapp: varchar({ length: 255 }),
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

// Boutique Credits Table
export const boutiqueCredits = pgTable(
	"boutiqueCredits",
	{
		id: serial().primaryKey().notNull(),
		boutiqueId: serial().notNull().references(() => boutiques.id),
		credits: decimal({ precision: 10, scale: 2 }).default("0").notNull(),
		createdAt: timestamp({ mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
	},
	(table) => [index("idx_boutique_credits_boutique").on(table.boutiqueId)]
);

// Boutique Settings Table
export const boutiqueSettings = pgTable(
	"boutiqueSettings",
	{
		id: serial().primaryKey().notNull(),
		boutiqueId: serial().notNull().references(() => boutiques.id),
		setting_key: varchar({ length: 255 }).notNull(),
		setting_value: text().notNull(),
		createdAt: timestamp({ mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
	},
	(table) => [
		index("idx_boutique_settings_boutique").on(table.boutiqueId),
		index("idx_boutique_settings_key").on(table.setting_key),
	]
);

// Boutique Subscriptions Table
export const boutiqueSubscriptions = pgTable(
	"boutiqueSubscriptions",
	{
		id: serial().primaryKey().notNull(),
		boutiqueId: serial().notNull().references(() => boutiques.id),
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
	"boutiqueTransactions",
	{
		id: serial().primaryKey().notNull(),
		boutiqueId: serial().notNull().references(() => boutiques.id),
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
	"boutiqueUsers",
	{
		id: serial().primaryKey().notNull(),
		boutiqueId: serial().notNull().references(() => boutiques.id),
		userId: serial().notNull().references(() => users.id),
		role: varchar({ length: 50 }).default("staff").notNull(),
		createdAt: timestamp({ mode: "string" })
			.default(sql`CURRENT_TIMESTAMP`)
			.notNull(),
		updatedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
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
		boutiqueId: serial().notNull().references(() => boutiques.id),
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
		boutiqueId: serial().notNull().references(() => boutiques.id),
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
	"userCredits",
	{
		id: serial().primaryKey().notNull(),
		userId: serial().notNull().references(() => users.id),
		credits: decimal({ precision: 10, scale: 2 }).default("0").notNull(),
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
		userId: serial().notNull().references(() => users.id),
		garmentId: serial().references(() => garments.id),
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
		userId: serial().notNull().references(() => users.id),
		tryOnResultId: serial().notNull().references(() => tryOnResults.id),
		title: varchar({ length: 255 }).notNull(),
		description: text(),
		watermarkedImageUrl: varchar({ length: 500 }).notNull(),
		isFavorite: serial().default(0).notNull(),
		comparisonNotes: text(),
		shareCount: serial().default(0).notNull(),
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
	batchUploadId: serial(),
	file_name: varchar({ length: 255 }),
	createdAt: timestamp({ mode: "string" })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
});

export const batchUploads = pgTable("batchUploads", {
	id: serial().primaryKey().notNull(),
	boutiqueId: serial(),
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
	userId: serial(),
	email: varchar({ length: 255 }),
	subject: varchar({ length: 255 }),
	createdAt: timestamp({ mode: "string" })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
});

export const favorites = pgTable("favorites", {
	id: serial().primaryKey().notNull(),
	userId: serial(),
	garmentId: serial(),
	createdAt: timestamp({ mode: "string" })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
});

export const featureAccessLogs = pgTable("featureAccessLogs", {
	id: serial().primaryKey().notNull(),
	userId: serial(),
	feature_name: varchar({ length: 255 }),
	createdAt: timestamp({ mode: "string" })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
});

export const inAppNotifications = pgTable("inAppNotifications", {
	id: serial().primaryKey().notNull(),
	userId: serial(),
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
	productId: serial(),
	size: varchar({ length: 50 }),
	createdAt: timestamp({ mode: "string" })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
});

export const reviews = pgTable("reviews", {
	id: serial().primaryKey().notNull(),
	userId: serial(),
	productId: serial(),
	rating: integer(),
	comment: text(),
	createdAt: timestamp({ mode: "string" })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
});

export const shopOrders = pgTable("shopOrders", {
	id: serial().primaryKey().notNull(),
	userId: serial(),
	total_amount: decimal({ precision: 10, scale: 2 }),
	status: varchar({ length: 50 }),
	createdAt: timestamp({ mode: "string" })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
});

export const subscriptionAuditLog = pgTable("subscriptionAuditLog", {
	id: serial().primaryKey().notNull(),
	subscriptionId: serial(),
	action: varchar({ length: 255 }),
	createdAt: timestamp({ mode: "string" })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
});

export const transactions = pgTable("transactions", {
	id: serial().primaryKey().notNull(),
	userId: serial(),
	amount: decimal({ precision: 10, scale: 2 }),
	status: varchar({ length: 50 }),
	createdAt: timestamp({ mode: "string" })
		.default(sql`CURRENT_TIMESTAMP`)
		.notNull(),
});

export const tryOnUserMonthlyUsage = pgTable("userMonthlyUsage", {
	id: serial().primaryKey().notNull(),
	userId: serial(),
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
