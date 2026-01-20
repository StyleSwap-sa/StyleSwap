import { relations } from "drizzle-orm";
import {
  users,
  boutiques,
  boutiqueUsers,
  boutiqueSettings,
  boutiqueCredits,
  boutiqueTransactions,
  products,
  tryOnResults,
  garments,
  userCredits,
  transactions,
  emailNotifications,
  favorites,
  auditLogs,
  deletionLogs,
} from "./schema";

export const usersRelations = relations(users, ({ many, one }) => ({
  ownedBoutiques: many(boutiques, { relationName: "owner" }),
  boutiqueUsers: many(boutiqueUsers),
  userCredits: one(userCredits),
  transactions: many(transactions),
  emailNotifications: many(emailNotifications),
  favorites: many(favorites),
  auditLogs: many(auditLogs),
  deletionLogs: many(deletionLogs),
  initiatedTransactions: many(boutiqueTransactions, { relationName: "initiatedBy" }),
}));

export const boutiquesRelations = relations(boutiques, ({ one, many }) => ({
  owner: one(users, {
    fields: [boutiques.ownerId],
    references: [users.id],
    relationName: "owner",
  }),
  staff: many(boutiqueUsers),
  settings: one(boutiqueSettings),
  credits: one(boutiqueCredits),
  transactions: many(boutiqueTransactions),
  products: many(products),
  tryOns: many(tryOnResults),
  auditLogs: many(auditLogs),
  deletionLogs: many(deletionLogs),
}));

export const boutiqueUsersRelations = relations(boutiqueUsers, ({ one }) => ({
  boutique: one(boutiques, {
    fields: [boutiqueUsers.boutiqueId],
    references: [boutiques.id],
  }),
  user: one(users, {
    fields: [boutiqueUsers.userId],
    references: [users.id],
  }),
}));

export const boutiqueSettingsRelations = relations(boutiqueSettings, ({ one }) => ({
  boutique: one(boutiques, {
    fields: [boutiqueSettings.boutiqueId],
    references: [boutiques.id],
  }),
}));

export const boutiqueCreditsRelations = relations(boutiqueCredits, ({ one }) => ({
  boutique: one(boutiques, {
    fields: [boutiqueCredits.boutiqueId],
    references: [boutiques.id],
  }),
}));

export const boutiqueTransactionsRelations = relations(boutiqueTransactions, ({ one }) => ({
  boutique: one(boutiques, {
    fields: [boutiqueTransactions.boutiqueId],
    references: [boutiques.id],
  }),
  initiatedBy: one(users, {
    fields: [boutiqueTransactions.initiatedBy],
    references: [users.id],
    relationName: "initiatedBy",
  }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  boutique: one(boutiques, {
    fields: [products.boutiqueId],
    references: [boutiques.id],
  }),
  tryOns: many(tryOnResults),
}));

export const tryOnResultsRelations = relations(tryOnResults, ({ one }) => ({
  user: one(users, {
    fields: [tryOnResults.userId],
    references: [users.id],
  }),
  boutique: one(boutiques, {
    fields: [tryOnResults.boutiqueId],
    references: [boutiques.id],
  }),
  product: one(products, {
    fields: [tryOnResults.productId],
    references: [products.id],
  }),
  garment: one(garments, {
    fields: [tryOnResults.garmentId],
    references: [garments.id],
  }),
}));

export const garmentsRelations = relations(garments, ({ many }) => ({
  tryOns: many(tryOnResults),
  favorites: many(favorites),
}));

export const userCreditsRelations = relations(userCredits, ({ one }) => ({
  user: one(users, {
    fields: [userCredits.userId],
    references: [users.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

export const emailNotificationsRelations = relations(emailNotifications, ({ one }) => ({
  user: one(users, {
    fields: [emailNotifications.userId],
    references: [users.id],
  }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
  garment: one(garments, {
    fields: [favorites.garmentId],
    references: [garments.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  boutique: one(boutiques, {
    fields: [auditLogs.boutiqueId],
    references: [boutiques.id],
  }),
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

export const deletionLogsRelations = relations(deletionLogs, ({ one }) => ({
  boutique: one(boutiques, {
    fields: [deletionLogs.boutiqueId],
    references: [boutiques.id],
  }),
  user: one(users, {
    fields: [deletionLogs.userId],
    references: [users.id],
  }),
  deletedBy: one(users, {
    fields: [deletionLogs.deletedBy],
    references: [users.id],
  }),
}));
