import { mysqlTable, text, timestamp, int, varchar, json, boolean, decimal, index } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Developer Integrations table - showcases StyleSwap API integrations
 */
export const developerIntegrations = mysqlTable(
  "developer_integrations",
  {
    id: int("id").primaryKey().autoincrement(),
    developerId: int("developer_id").notNull(), // Reference to app registration
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description").notNull(),
    category: varchar("category", { length: 100 }).notNull(), // e.g., "e-commerce", "social", "mobile-app"
    logoUrl: text("logo_url"),
    websiteUrl: text("website_url"),
    githubUrl: text("github_url"),
    documentationUrl: text("documentation_url"),
    codeExamples: json("code_examples").$type<Array<{
      language: string;
      title: string;
      url: string;
    }>>().default([]),
    features: json("features").$type<string[]>().default([]), // e.g., ["virtual-tryon", "batch-processing"]
    rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
    reviewCount: int("review_count").default(0),
    downloadCount: int("download_count").default(0),
    isVerified: boolean("is_verified").default(false),
    isFeatured: boolean("is_featured").default(false),
    status: varchar("status", { length: 50 }).default("active"), // active, inactive, pending-review
    tags: json("tags").$type<string[]>().default([]),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => ({
    developerIdIdx: index("developer_id_idx").on(table.developerId),
    categoryIdx: index("category_idx").on(table.category),
    statusIdx: index("status_idx").on(table.status),
  })
);

/**
 * Integration Reviews table
 */
export const integrationReviews = mysqlTable(
  "integration_reviews",
  {
    id: int("id").primaryKey().autoincrement(),
    integrationId: int("integration_id").notNull(),
    userId: int("user_id").notNull(),
    rating: int("rating").notNull(), // 1-5
    title: varchar("title", { length: 255 }).notNull(),
    comment: text("comment"),
    helpful: int("helpful").default(0),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => ({
    integrationIdIdx: index("integration_id_idx").on(table.integrationId),
    userIdIdx: index("user_id_idx").on(table.userId),
  })
);

/**
 * Boutiques table - for marketplace discovery
 */
export const marketplaceBoutiques = mysqlTable(
  "marketplace_boutiques",
  {
    id: int("id").primaryKey().autoincrement(),
    boutiqueId: int("boutique_id").notNull(), // Reference to actual boutique account
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    logoUrl: text("logo_url"),
    bannerUrl: text("banner_url"),
    websiteUrl: text("website_url"),
    category: varchar("category", { length: 100 }).notNull(), // e.g., "luxury", "casual", "streetwear"
    subcategories: json("subcategories").$type<string[]>().default([]),
    location: varchar("location", { length: 255 }),
    country: varchar("country", { length: 100 }),
    city: varchar("city", { length: 100 }),
    phoneNumber: varchar("phone_number", { length: 20 }),
    email: varchar("email", { length: 255 }),
    socialMedia: json("social_media").$type<Record<string, string>>().default({}), // instagram, facebook, etc.
    tryOnEnabled: boolean("tryon_enabled").default(true),
    itemCount: int("item_count").default(0),
    rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
    reviewCount: int("review_count").default(0),
    followerCount: int("follower_count").default(0),
    isVerified: boolean("is_verified").default(false),
    isFeatured: boolean("is_featured").default(false),
    status: varchar("status", { length: 50 }).default("active"), // active, inactive, pending-verification
    tags: json("tags").$type<string[]>().default([]),
    operatingHours: json("operating_hours").$type<Record<string, { open: string; close: string }>>().default({}),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => ({
    boutiqueIdIdx: index("boutique_id_idx").on(table.boutiqueId),
    categoryIdx: index("boutique_category_idx").on(table.category),
    statusIdx: index("boutique_status_idx").on(table.status),
    countryIdx: index("country_idx").on(table.country),
    cityIdx: index("city_idx").on(table.city),
  })
);

/**
 * Boutique Reviews table
 */
export const boutiqueReviews = mysqlTable(
  "boutique_reviews",
  {
    id: int("id").primaryKey().autoincrement(),
    boutiqueId: int("boutique_id").notNull(),
    userId: int("user_id").notNull(),
    rating: int("rating").notNull(), // 1-5
    title: varchar("title", { length: 255 }).notNull(),
    comment: text("comment"),
    tryOnQuality: int("tryon_quality"), // 1-5 rating for try-on experience
    serviceQuality: int("service_quality"), // 1-5 rating for customer service
    helpful: int("helpful").default(0),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => ({
    boutiqueIdIdx: index("boutique_reviews_boutique_id_idx").on(table.boutiqueId),
    userIdIdx: index("boutique_reviews_user_id_idx").on(table.userId),
  })
);

/**
 * Marketplace Featured Items - showcase trending items from boutiques
 */
export const marketplaceFeaturedItems = mysqlTable(
  "marketplace_featured_items",
  {
    id: int("id").primaryKey().autoincrement(),
    boutiqueId: int("boutique_id").notNull(),
    itemId: varchar("item_id", { length: 255 }).notNull(), // Reference to actual item
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    price: decimal("price", { precision: 10, scale: 2 }),
    currency: varchar("currency", { length: 10 }).default("ZAR"),
    category: varchar("category", { length: 100 }),
    tryOnCount: int("tryon_count").default(0),
    viewCount: int("view_count").default(0),
    rating: decimal("rating", { precision: 3, scale: 2 }).default("0.00"),
    isFeatured: boolean("is_featured").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  },
  (table) => ({
    boutiqueIdIdx: index("featured_items_boutique_id_idx").on(table.boutiqueId),
    categoryIdx: index("featured_items_category_idx").on(table.category),
  })
);

/**
 * Marketplace Analytics - track visitor behavior
 */
export const marketplaceAnalytics = mysqlTable(
  "marketplace_analytics",
  {
    id: int("id").primaryKey().autoincrement(),
    entityType: varchar("entity_type", { length: 50 }).notNull(), // "integration", "boutique", "item"
    entityId: int("entity_id").notNull(),
    eventType: varchar("event_type", { length: 50 }).notNull(), // "view", "click", "download", "review"
    userId: int("user_id"), // Optional, for anonymous users
    metadata: json("metadata").$type<Record<string, any>>().default({}),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    entityIdx: index("entity_idx").on(table.entityType, table.entityId),
    eventTypeIdx: index("event_type_idx").on(table.eventType),
  })
);

/**
 * Relations
 */
export const developerIntegrationsRelations = relations(developerIntegrations, ({ many }) => ({
  reviews: many(integrationReviews),
}));

export const integrationReviewsRelations = relations(integrationReviews, ({ one }) => ({
  integration: one(developerIntegrations, {
    fields: [integrationReviews.integrationId],
    references: [developerIntegrations.id],
  }),
}));

export const marketplaceBoutiquesRelations = relations(marketplaceBoutiques, ({ many }) => ({
  reviews: many(boutiqueReviews),
  featuredItems: many(marketplaceFeaturedItems),
}));

export const boutiqueReviewsRelations = relations(boutiqueReviews, ({ one }) => ({
  boutique: one(marketplaceBoutiques, {
    fields: [boutiqueReviews.boutiqueId],
    references: [marketplaceBoutiques.id],
  }),
}));

export const marketplaceFeaturedItemsRelations = relations(marketplaceFeaturedItems, ({ one }) => ({
  boutique: one(marketplaceBoutiques, {
    fields: [marketplaceFeaturedItems.boutiqueId],
    references: [marketplaceBoutiques.id],
  }),
}));
