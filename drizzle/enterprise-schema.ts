import { pgTable, serial, text, varchar, boolean, timestamp, integer, decimal, json, pgEnum } from "drizzle-orm/pg-core";

/**
 * Enterprise Retail Pro Package Schema
 * Handles enterprise-level subscriptions for boutiques and retailers
 */

// Enterprise subscription status enum
export const enterpriseStatusEnum = pgEnum('enterprise_status', [
  'pending',      // Awaiting approval from sales team
  'active',       // Active subscription
  'paused',       // Temporarily paused
  'cancelled',    // Cancelled subscription
  'expired'       // Subscription expired
]);

// Enterprise subscription tier enum
export const enterpriseTierEnum = pgEnum('enterprise_tier', [
  'starter',      // Starter: R29/month
  'professional', // Professional: R99/month
  'enterprise'    // Enterprise Pro: Custom pricing
]);

/**
 * Enterprise Subscriptions Table
 * Stores enterprise subscription details for boutiques
 */
export const enterpriseSubscriptions = pgTable('enterprise_subscriptions', {
  id: serial('id').primaryKey(),
  
  // Boutique/User Reference
  boutiqueId: integer('boutique_id').notNull(),
  userId: integer('user_id').notNull(),
  
  // Subscription Details
  tier: enterpriseTierEnum('tier').notNull().default('starter'),
  status: enterpriseStatusEnum('status').notNull().default('pending'),
  
  // Pricing
  monthlyPrice: decimal('monthly_price', { precision: 10, scale: 2 }).notNull(),
  annualPrice: decimal('annual_price', { precision: 10, scale: 2 }),
  billingCycle: varchar('billing_cycle', { length: 10 }).notNull().default('monthly'), // 'monthly' or 'annual'
  
  // Features
  features: json('features').$type<{
    fullApiIntegration: boolean;
    whiteLabelOption: boolean;
    dedicatedAccountManager: boolean;
    customSla: boolean;
    priorityFeatureRequests: boolean;
    customIntegrations: boolean;
    apiRateLimit: number; // requests per minute
    maxItems: number; // unlimited if -1
    maxUsers: number; // team members
  }>().notNull(),
  
  // Account Manager
  accountManagerId: integer('account_manager_id'),
  accountManagerEmail: varchar('account_manager_email', { length: 255 }),
  accountManagerPhone: varchar('account_manager_phone', { length: 20 }),
  
  // SLA Details
  slaResponseTime: integer('sla_response_time'), // minutes
  slaUptime: decimal('sla_uptime', { precision: 5, scale: 2 }), // percentage (99.9)
  supportLevel: varchar('support_level', { length: 50 }).default('priority'), // 'standard', 'priority', '24/7'
  
  // White-Label
  whitelabelEnabled: boolean('whitelabel_enabled').default(false),
  whitelabelDomain: varchar('whitelabel_domain', { length: 255 }),
  whitelabelBranding: json('whitelabel_branding').$type<{
    logoUrl: string;
    primaryColor: string;
    secondaryColor: string;
    customDomain: string;
  }>(),
  
  // API Integration
  apiKeysCount: integer('api_keys_count').default(1),
  webhooksEnabled: boolean('webhooks_enabled').default(true),
  customIntegrations: json('custom_integrations').$type<string[]>().default([]),
  
  // Credits & Billing
  monthlyCreditsAllocation: integer('monthly_credits_allocation'),
  creditRollover: boolean('credit_rollover').default(false),
  billedAtPlanRate: boolean('billed_at_plan_rate').default(true),
  
  // Dates
  startDate: timestamp('start_date').notNull(),
  renewalDate: timestamp('renewal_date').notNull(),
  endDate: timestamp('end_date'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Enterprise Contact Requests Table
 * Stores inquiries from boutiques interested in Enterprise Pro
 */
export const enterpriseContactRequests = pgTable('enterprise_contact_requests', {
  id: serial('id').primaryKey(),
  
  // Contact Info
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  company: varchar('company', { length: 255 }).notNull(),
  
  // Business Info
  businessType: varchar('business_type', { length: 100 }),
  itemCount: integer('item_count'),
  monthlyTryOns: integer('monthly_try_ons'),
  
  // Interest
  interestedFeatures: json('interested_features').$type<string[]>(),
  message: text('message'),
  
  // Status
  status: varchar('status', { length: 50 }).default('new'), // 'new', 'contacted', 'qualified', 'converted', 'rejected'
  assignedTo: integer('assigned_to'), // Sales team member ID
  
  // Dates
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  contactedAt: timestamp('contacted_at'),
});

/**
 * Enterprise API Keys Table
 * Stores API keys for enterprise customers
 */
export const enterpriseApiKeys = pgTable('enterprise_api_keys', {
  id: serial('id').primaryKey(),
  
  subscriptionId: integer('subscription_id').notNull(),
  boutiqueId: integer('boutique_id').notNull(),
  
  // API Key Details
  keyName: varchar('key_name', { length: 255 }).notNull(),
  apiKey: varchar('api_key', { length: 255 }).notNull().unique(),
  apiSecret: varchar('api_secret', { length: 255 }).notNull(),
  
  // Permissions
  permissions: json('permissions').$type<string[]>().default(['read', 'write']),
  
  // Rate Limiting
  rateLimit: integer('rate_limit').notNull(), // requests per minute
  
  // Status
  isActive: boolean('is_active').default(true),
  lastUsed: timestamp('last_used'),
  
  // Dates
  createdAt: timestamp('created_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at'),
});

/**
 * Enterprise Webhooks Table
 * Stores webhook configurations for enterprise customers
 */
export const enterpriseWebhooks = pgTable('enterprise_webhooks', {
  id: serial('id').primaryKey(),
  
  subscriptionId: integer('subscription_id').notNull(),
  boutiqueId: integer('boutique_id').notNull(),
  
  // Webhook Details
  name: varchar('name', { length: 255 }).notNull(),
  url: varchar('url', { length: 500 }).notNull(),
  
  // Events
  events: json('events').$type<string[]>().notNull(), // 'try_on.completed', 'item.created', etc.
  
  // Configuration
  isActive: boolean('is_active').default(true),
  retryPolicy: json('retry_policy').$type<{
    maxRetries: number;
    backoffMultiplier: number;
  }>(),
  
  // Dates
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Enterprise Usage Logs Table
 * Tracks API usage for enterprise customers
 */
export const enterpriseUsageLogs = pgTable('enterprise_usage_logs', {
  id: serial('id').primaryKey(),
  
  subscriptionId: integer('subscription_id').notNull(),
  apiKeyId: integer('api_key_id'),
  
  // Usage Details
  endpoint: varchar('endpoint', { length: 255 }).notNull(),
  method: varchar('method', { length: 10 }).notNull(),
  statusCode: integer('status_code'),
  
  // Metrics
  responseTime: integer('response_time'), // milliseconds
  requestSize: integer('request_size'), // bytes
  responseSize: integer('response_size'), // bytes
  
  // Date
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

/**
 * Enterprise Support Tickets Table
 * Tracks support tickets for enterprise customers
 */
export const enterpriseSupportTickets = pgTable('enterprise_support_tickets', {
  id: serial('id').primaryKey(),
  
  subscriptionId: integer('subscription_id').notNull(),
  boutiqueId: integer('boutique_id').notNull(),
  
  // Ticket Details
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  
  // Status & Priority
  status: varchar('status', { length: 50 }).default('open'), // 'open', 'in_progress', 'resolved', 'closed'
  priority: varchar('priority', { length: 20 }).default('medium'), // 'low', 'medium', 'high', 'critical'
  
  // Assignment
  assignedTo: integer('assigned_to'),
  
  // SLA
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at'),
  slaDeadline: timestamp('sla_deadline'),
});

/**
 * Enterprise Custom Integrations Table
 * Stores custom integration details for enterprise customers
 */
export const enterpriseCustomIntegrations = pgTable('enterprise_custom_integrations', {
  id: serial('id').primaryKey(),
  
  subscriptionId: integer('subscription_id').notNull(),
  
  // Integration Details
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 100 }).notNull(), // 'shopify', 'woocommerce', 'custom', etc.
  
  // Configuration
  config: json('config').$type<Record<string, any>>(),
  
  // Status
  isActive: boolean('is_active').default(true),
  
  // Dates
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Enterprise Billing History Table
 * Tracks billing and payment history for enterprise customers
 */
export const enterpriseBillingHistory = pgTable('enterprise_billing_history', {
  id: serial('id').primaryKey(),
  
  subscriptionId: integer('subscription_id').notNull(),
  
  // Billing Details
  invoiceNumber: varchar('invoice_number', { length: 100 }).notNull().unique(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('ZAR'),
  
  // Items
  items: json('items').$type<Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>>(),
  
  // Status
  status: varchar('status', { length: 50 }).default('pending'), // 'pending', 'paid', 'failed', 'refunded'
  paymentMethod: varchar('payment_method', { length: 100 }),
  
  // Dates
  invoiceDate: timestamp('invoice_date').notNull(),
  dueDate: timestamp('due_date'),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
