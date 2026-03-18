import { relations } from "drizzle-orm/relations";
import { boutiques, auditLogs, users, boutiqueCredits, boutiqueSettings, boutiqueTransactions, boutiqueUsers, deletionLogs, emailNotifications, favorites, garments, products, transactions, tryOnResults, userCredits } from "./schema";

export const auditLogsRelations = relations(auditLogs, ({one}) => ({
	boutique: one(boutiques, {
		fields: [auditLogs.boutiqueId],
		references: [boutiques.id]
	}),
	user: one(users, {
		fields: [auditLogs.userId],
		references: [users.id]
	}),
}));

export const boutiquesRelations = relations(boutiques, ({one, many}) => ({
	auditLogs: many(auditLogs),
	boutiqueCredits: many(boutiqueCredits),
	boutiqueSettings: many(boutiqueSettings),
	boutiqueTransactions: many(boutiqueTransactions),
	boutiqueUsers: many(boutiqueUsers),
	user: one(users, {
		fields: [boutiques.ownerId],
		references: [users.id]
	}),
	deletionLogs: many(deletionLogs),
	products: many(products),
	tryOnResults: many(tryOnResults),
}));

export const usersRelations = relations(users, ({many}) => ({
	auditLogs: many(auditLogs),
	boutiqueTransactions: many(boutiqueTransactions),
	boutiqueUsers: many(boutiqueUsers),
	boutiques: many(boutiques),
	deletionLogs_userId: many(deletionLogs, {
		relationName: "deletionLogs_userId_users_id"
	}),
	deletionLogs_deletedBy: many(deletionLogs, {
		relationName: "deletionLogs_deletedBy_users_id"
	}),
	emailNotifications: many(emailNotifications),
	favorites: many(favorites),
	transactions: many(transactions),
	tryOnResults: many(tryOnResults),
	userCredits: many(userCredits),
}));

export const boutiqueCreditsRelations = relations(boutiqueCredits, ({one}) => ({
	boutique: one(boutiques, {
		fields: [boutiqueCredits.boutiqueId],
		references: [boutiques.id]
	}),
}));

export const boutiqueSettingsRelations = relations(boutiqueSettings, ({one}) => ({
	boutique: one(boutiques, {
		fields: [boutiqueSettings.boutiqueId],
		references: [boutiques.id]
	}),
}));

export const boutiqueTransactionsRelations = relations(boutiqueTransactions, ({one}) => ({
	boutique: one(boutiques, {
		fields: [boutiqueTransactions.boutiqueId],
		references: [boutiques.id]
	}),
	user: one(users, {
		fields: [boutiqueTransactions.initiatedBy],
		references: [users.id]
	}),
}));

export const boutiqueUsersRelations = relations(boutiqueUsers, ({one}) => ({
	boutique: one(boutiques, {
		fields: [boutiqueUsers.boutiqueId],
		references: [boutiques.id]
	}),
	user: one(users, {
		fields: [boutiqueUsers.userId],
		references: [users.id]
	}),
}));

export const deletionLogsRelations = relations(deletionLogs, ({one}) => ({
	boutique: one(boutiques, {
		fields: [deletionLogs.boutiqueId],
		references: [boutiques.id]
	}),
	user_userId: one(users, {
		fields: [deletionLogs.userId],
		references: [users.id],
		relationName: "deletionLogs_userId_users_id"
	}),
	user_deletedBy: one(users, {
		fields: [deletionLogs.deletedBy],
		references: [users.id],
		relationName: "deletionLogs_deletedBy_users_id"
	}),
}));

export const emailNotificationsRelations = relations(emailNotifications, ({one}) => ({
	user: one(users, {
		fields: [emailNotifications.userId],
		references: [users.id]
	}),
}));

export const favoritesRelations = relations(favorites, ({one}) => ({
	user: one(users, {
		fields: [favorites.userId],
		references: [users.id]
	}),
	garment: one(garments, {
		fields: [favorites.garmentId],
		references: [garments.id]
	}),
}));

export const garmentsRelations = relations(garments, ({many}) => ({
	favorites: many(favorites),
	tryOnResults: many(tryOnResults),
}));

export const productsRelations = relations(products, ({one, many}) => ({
	boutique: one(boutiques, {
		fields: [products.boutiqueId],
		references: [boutiques.id]
	}),
	tryOnResults: many(tryOnResults),
}));

export const transactionsRelations = relations(transactions, ({one}) => ({
	user: one(users, {
		fields: [transactions.userId],
		references: [users.id]
	}),
}));

export const tryOnResultsRelations = relations(tryOnResults, ({one}) => ({
	boutique: one(boutiques, {
		fields: [tryOnResults.boutiqueId],
		references: [boutiques.id]
	}),
	user: one(users, {
		fields: [tryOnResults.userId],
		references: [users.id]
	}),
	product: one(products, {
		fields: [tryOnResults.productId],
		references: [products.id]
	}),
	garment: one(garments, {
		fields: [tryOnResults.garmentId],
		references: [garments.id]
	}),
}));

export const userCreditsRelations = relations(userCredits, ({one}) => ({
	user: one(users, {
		fields: [userCredits.userId],
		references: [users.id]
	}),
}));