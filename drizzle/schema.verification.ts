import { mysqlTable, int, varchar, text, timestamp, mysqlEnum, decimal, index, boolean } from "drizzle-orm/mysql-core";
import { boutiques, users } from "./schema";

/**
 * Boutique Verification System
 * Supports both formal business verification and social media seller verification
 */

// Main verification record for each boutique
export const boutiqueVerifications = mysqlTable("boutiqueVerifications", {
	id: int().autoincrement().notNull().primaryKey(),
	boutiqueId: int().notNull().references(() => boutiques.id),
	verificationStatus: mysqlEnum(['pending', 'approved', 'rejected', 'suspended', 'expired']).default('pending').notNull(),
	verificationType: mysqlEnum(['formal_business', 'social_media']).notNull(),
	trustScore: int().default(0).notNull(), // 0-100
	riskScore: int().default(50).notNull(), // 0-100 (higher = more risk)
	
	// Formal business verification fields
	businessName: varchar({ length: 255 }),
	businessRegistrationNumber: varchar({ length: 100 }),
	businessLicenseUrl: varchar({ length: 500 }),
	taxId: varchar({ length: 100 }),
	businessAddress: text(),
	
	// Social media verification fields
	verificationMethod: mysqlEnum(['documents', 'social_media', 'hybrid']).default('documents').notNull(),
	socialMediaScore: int().default(0), // 0-100
	salesHistoryScore: int().default(0), // 0-100
	customerFeedbackScore: int().default(0), // 0-100
	
	// Verification timeline
	submittedAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	approvedAt: timestamp({ mode: 'string' }),
	rejectedAt: timestamp({ mode: 'string' }),
	expiresAt: timestamp({ mode: 'string' }), // Annual re-verification required
	
	// Admin review
	reviewedBy: int().references(() => users.id),
	rejectionReason: text(),
	adminNotes: text(),
	
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
}, (table) => [
	index("idx_verification_boutique").on(table.boutiqueId),
	index("idx_verification_status").on(table.verificationStatus),
	index("idx_verification_type").on(table.verificationType),
	index("idx_verification_trust_score").on(table.trustScore),
	index("idx_verification_risk_score").on(table.riskScore),
]);

// Document uploads for verification
export const boutiqueDocuments = mysqlTable("boutiqueDocuments", {
	id: int().autoincrement().notNull().primaryKey(),
	boutiqueId: int().notNull().references(() => boutiques.id),
	verificationId: int().notNull().references(() => boutiqueVerifications.id),
	
	documentType: mysqlEnum([
		'government_id',
		'passport',
		'drivers_license',
		'business_license',
		'tax_registration',
		'utility_bill',
		'lease_agreement',
		'bank_statement',
		'social_media_screenshot',
		'customer_testimonial'
	]).notNull(),
	
	documentUrl: varchar({ length: 500 }).notNull(),
	fileName: varchar({ length: 255 }).notNull(),
	fileSize: int(), // in bytes
	mimeType: varchar({ length: 50 }),
	
	verificationStatus: mysqlEnum(['pending', 'verified', 'rejected', 'needs_resubmission']).default('pending').notNull(),
	verifiedAt: timestamp({ mode: 'string' }),
	rejectionReason: text(),
	
	// OCR extracted data (for ID documents)
	extractedData: text(), // JSON string with extracted info
	
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
}, (table) => [
	index("idx_documents_boutique").on(table.boutiqueId),
	index("idx_documents_verification").on(table.verificationId),
	index("idx_documents_type").on(table.documentType),
	index("idx_documents_status").on(table.verificationStatus),
]);

// Social media accounts linked to boutique
export const socialMediaAccounts = mysqlTable("socialMediaAccounts", {
	id: int().autoincrement().notNull().primaryKey(),
	boutiqueId: int().notNull().references(() => boutiques.id),
	
	platform: mysqlEnum(['instagram', 'tiktok', 'facebook', 'whatsapp', 'twitter', 'youtube']).notNull(),
	username: varchar({ length: 255 }).notNull(),
	accountUrl: varchar({ length: 500 }).notNull(),
	
	// Metrics
	followerCount: int().default(0).notNull(),
	followingCount: int().default(0).notNull(),
	postCount: int().default(0).notNull(),
	engagementRate: decimal({ precision: 5, scale: 2 }).default('0.00'), // percentage
	
	// Verification
	verified: boolean().default(false).notNull(),
	verifiedBadge: boolean().default(false), // Official blue checkmark
	accountAgeInDays: int().default(0),
	
	// Authenticity scoring
	authenticityScore: int().default(0), // 0-100
	lastChecked: timestamp({ mode: 'string' }),
	
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
}, (table) => [
	index("idx_social_media_boutique").on(table.boutiqueId),
	index("idx_social_media_platform").on(table.platform),
	index("idx_social_media_verified").on(table.verified),
]);

// Sales history and evidence for social media sellers
export const sellerSalesEvidence = mysqlTable("sellerSalesEvidence", {
	id: int().autoincrement().notNull().primaryKey(),
	boutiqueId: int().notNull().references(() => boutiques.id),
	
	evidenceType: mysqlEnum([
		'customer_dm',
		'order_screenshot',
		'customer_review',
		'testimonial',
		'payment_proof',
		'shipping_proof'
	]).notNull(),
	
	imageUrl: varchar({ length: 500 }).notNull(),
	description: text(),
	
	// Verification
	verified: boolean().default(false).notNull(),
	verifiedAt: timestamp({ mode: 'string' }),
	rejectionReason: text(),
	
	// Metadata
	customerName: varchar({ length: 255 }),
	customerEmail: varchar({ length: 320 }),
	transactionDate: timestamp({ mode: 'string' }),
	amount: decimal({ precision: 10, scale: 2 }),
	currency: varchar({ length: 3 }).default('ZAR'),
	
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
}, (table) => [
	index("idx_sales_evidence_boutique").on(table.boutiqueId),
	index("idx_sales_evidence_type").on(table.evidenceType),
	index("idx_sales_evidence_verified").on(table.verified),
]);

// Fraud flags and risk indicators
export const fraudFlags = mysqlTable("fraudFlags", {
	id: int().autoincrement().notNull().primaryKey(),
	boutiqueId: int().notNull().references(() => boutiques.id),
	
	flagType: mysqlEnum([
		'velocity_check', // Multiple accounts from same IP/email
		'behavioral_anomaly', // Unusual activity patterns
		'chargeback', // Payment disputes
		'high_refund_rate', // Excessive refunds
		'customer_complaint', // Customer reports fraud
		'duplicate_account', // Duplicate account detected
		'fake_documents', // Forged documents
		'bot_followers', // Fake social media followers
		'suspicious_activity' // General suspicious behavior
	]).notNull(),
	
	severity: mysqlEnum(['low', 'medium', 'high', 'critical']).default('medium').notNull(),
	description: text().notNull(),
	
	// Evidence
	evidenceData: text(), // JSON with details
	
	// Action taken
	actionTaken: mysqlEnum(['none', 'warning', 'review', 'suspension', 'ban']).default('none').notNull(),
	actionDate: timestamp({ mode: 'string' }),
	
	// Resolution
	resolved: boolean().default(false).notNull(),
	resolvedAt: timestamp({ mode: 'string' }),
	resolution: text(),
	
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
}, (table) => [
	index("idx_fraud_flags_boutique").on(table.boutiqueId),
	index("idx_fraud_flags_type").on(table.flagType),
	index("idx_fraud_flags_severity").on(table.severity),
	index("idx_fraud_flags_resolved").on(table.resolved),
]);

// Verification history and audit trail
export const verificationHistory = mysqlTable("verificationHistory", {
	id: int().autoincrement().notNull().primaryKey(),
	boutiqueId: int().notNull().references(() => boutiques.id),
	verificationId: int().references(() => boutiqueVerifications.id),
	
	action: varchar({ length: 100 }).notNull(), // 'submitted', 'reviewed', 'approved', 'rejected', 'suspended'
	previousStatus: varchar({ length: 50 }),
	newStatus: varchar({ length: 50 }),
	
	changedBy: int().references(() => users.id), // Admin user or system
	notes: text(),
	
	// Score changes
	previousTrustScore: int(),
	newTrustScore: int(),
	previousRiskScore: int(),
	newRiskScore: int(),
	
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
}, (table) => [
	index("idx_verification_history_boutique").on(table.boutiqueId),
	index("idx_verification_history_action").on(table.action),
	index("idx_verification_history_created").on(table.createdAt),
]);

// Verification checks and requirements
export const verificationChecks = mysqlTable("verificationChecks", {
	id: int().autoincrement().notNull().primaryKey(),
	verificationId: int().notNull().references(() => boutiqueVerifications.id),
	
	checkType: mysqlEnum([
		'identity_verification',
		'business_registration',
		'address_verification',
		'bank_account_verification',
		'social_media_authenticity',
		'sales_history',
		'customer_feedback',
		'video_verification',
		'product_sample_verification'
	]).notNull(),
	
	status: mysqlEnum(['pending', 'in_progress', 'completed', 'failed', 'waived']).default('pending').notNull(),
	
	// Details
	description: text(),
	requirements: text(), // JSON with specific requirements
	
	// Results
	result: mysqlEnum(['pass', 'fail', 'inconclusive']),
	resultDetails: text(),
	
	// Timeline
	startedAt: timestamp({ mode: 'string' }),
	completedAt: timestamp({ mode: 'string' }),
	
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
}, (table) => [
	index("idx_verification_checks_verification").on(table.verificationId),
	index("idx_verification_checks_type").on(table.checkType),
	index("idx_verification_checks_status").on(table.status),
]);

// Chargeback and dispute tracking
export const chargebackRecords = mysqlTable("chargebackRecords", {
	id: int().autoincrement().notNull().primaryKey(),
	boutiqueId: int().notNull().references(() => boutiques.id),
	
	chargebackId: varchar({ length: 255 }).notNull(),
	amount: decimal({ precision: 10, scale: 2 }).notNull(),
	currency: varchar({ length: 3 }).default('ZAR'),
	
	reason: text(),
	status: mysqlEnum(['initiated', 'under_review', 'resolved', 'lost']).default('initiated').notNull(),
	
	reportedDate: timestamp({ mode: 'string' }).notNull(),
	resolvedDate: timestamp({ mode: 'string' }),
	
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
}, (table) => [
	index("idx_chargeback_boutique").on(table.boutiqueId),
	index("idx_chargeback_status").on(table.status),
]);

// Customer complaints against boutiques
export const customerComplaints = mysqlTable("customerComplaints", {
	id: int().autoincrement().notNull().primaryKey(),
	boutiqueId: int().notNull().references(() => boutiques.id),
	customerId: int().notNull().references(() => users.id),
	
	complaintType: mysqlEnum([
		'fraud',
		'poor_quality',
		'non_delivery',
		'counterfeit',
		'misleading_description',
		'damaged_product',
		'unauthorized_charge',
		'other'
	]).notNull(),
	
	description: text().notNull(),
	severity: mysqlEnum(['low', 'medium', 'high', 'critical']).default('medium').notNull(),
	
	status: mysqlEnum(['open', 'under_review', 'resolved', 'escalated']).default('open').notNull(),
	resolution: text(),
	
	createdAt: timestamp({ mode: 'string' }).default('CURRENT_TIMESTAMP').notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().onUpdateNow().notNull(),
}, (table) => [
	index("idx_complaints_boutique").on(table.boutiqueId),
	index("idx_complaints_customer").on(table.customerId),
	index("idx_complaints_status").on(table.status),
	index("idx_complaints_severity").on(table.severity),
]);
