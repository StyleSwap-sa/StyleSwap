import { getDb } from "../db";
import { sizeReviews, customerSizePreferences } from "../../drizzle/schema";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";

export interface SizeReviewInput {
  userId: number;
  boutiqueId: number;
  tryOnResultId?: number;
  clothingType: string;
  selectedSize: number;
  bodySize: number;
  fitRating: "tight" | "perfect" | "loose";
  helpfulnessRating?: number;
  reviewText?: string;
  recommendedSize?: number;
  bodyType?: string;
  height?: string;
  weight?: string;
}

export interface SizeReviewData {
  id: number;
  userId: number;
  selectedSize: number;
  bodySize: number;
  fitRating: "tight" | "perfect" | "loose";
  helpfulnessRating?: number;
  reviewText?: string;
  recommendedSize?: number;
  bodyType?: string;
  height?: string;
  weight?: string;
  helpfulCount: number;
  unhelpfulCount: number;
  isVerifiedPurchase: number;
  createdAt: string;
}

/**
 * Save a size review from a customer
 */
export async function saveSizeReview(input: SizeReviewInput): Promise<SizeReviewData> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(sizeReviews).values({
    userId: input.userId,
    boutiqueId: input.boutiqueId,
    tryOnResultId: input.tryOnResultId,
    clothingType: input.clothingType,
    selectedSize: input.selectedSize,
    bodySize: input.bodySize,
    fitRating: input.fitRating,
    helpfulnessRating: input.helpfulnessRating || 0,
    reviewText: input.reviewText,
    recommendedSize: input.recommendedSize,
    bodyType: input.bodyType,
    height: input.height,
    weight: input.weight,
  });

  return getReviewById(Number(result[0].insertId));
}

/**
 * Get a review by ID
 */
export async function getReviewById(id: number): Promise<SizeReviewData> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const review = await db
    .select()
    .from(sizeReviews)
    .where(eq(sizeReviews.id, id))
    .limit(1);

  if (!review.length) {
    throw new Error("Review not found");
  }

  return review[0] as SizeReviewData;
}

/**
 * Get reviews for a specific size and clothing type
 */
export async function getReviewsForSize(
  clothingType: string,
  selectedSize: number,
  limit: number = 5
): Promise<SizeReviewData[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const results = await db
    .select()
    .from(sizeReviews)
    .where(
      and(
        eq(sizeReviews.clothingType, clothingType),
        eq(sizeReviews.selectedSize, selectedSize)
      )
    )
    .orderBy(desc(sizeReviews.helpfulCount))
    .limit(limit);

  return results as SizeReviewData[];
}

/**
 * Get size recommendations based on body size and clothing type
 */
export async function getSizeRecommendations(
  bodySize: number,
  clothingType: string
): Promise<{
  recommendedSize: number;
  alternativeSizes: number[];
  reviews: SizeReviewData[];
  confidence: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const similarBodyReviews = await db
    .select()
    .from(sizeReviews)
    .where(
      and(
        eq(sizeReviews.clothingType, clothingType),
        gte(sizeReviews.bodySize, bodySize - 2),
        lte(sizeReviews.bodySize, bodySize + 2)
      )
    );

  if (!similarBodyReviews.length) {
    return {
      recommendedSize: bodySize,
      alternativeSizes: [bodySize - 2, bodySize, bodySize + 2].filter(s => s > 0),
      reviews: [],
      confidence: 0,
    };
  }

  const perfectFitCounts: Record<number, number> = {};

  for (const review of similarBodyReviews) {
    if (review.fitRating === "perfect") {
      perfectFitCounts[review.selectedSize] = (perfectFitCounts[review.selectedSize] || 0) + 1;
    }
  }

  let recommendedSize = bodySize;
  let maxCount = 0;

  for (const [size, count] of Object.entries(perfectFitCounts)) {
    if (count > maxCount) {
      maxCount = count;
      recommendedSize = parseInt(size);
    }
  }

  const alternativeSizes = Object.entries(perfectFitCounts)
    .filter(([_, count]) => count > 0 && count < maxCount)
    .map(([size]) => parseInt(size))
    .sort((a, b) => a - b);

  const confidence = Math.min(100, (maxCount / similarBodyReviews.length) * 100);

  const topReviews = await getReviewsForSize(clothingType, recommendedSize, 3);

  return {
    recommendedSize,
    alternativeSizes,
    reviews: topReviews,
    confidence: Math.round(confidence),
  };
}

/**
 * Update customer size preferences
 */
export async function updateCustomerPreferences(
  userId: number,
  boutiqueId: number,
  bodySize: number,
  clothingType: string,
  preferences: {
    preferredSize?: number;
    bodyType?: string;
    height?: string;
    weight?: string;
    notes?: string;
  }
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await db
    .select()
    .from(customerSizePreferences)
    .where(
      and(
        eq(customerSizePreferences.userId, userId),
        eq(customerSizePreferences.boutiqueId, boutiqueId),
        eq(customerSizePreferences.clothingType, clothingType)
      )
    )
    .limit(1);

  if (existing.length) {
    await db
      .update(customerSizePreferences)
      .set({
        bodySize,
        preferredSize: preferences.preferredSize,
        bodyType: preferences.bodyType,
        height: preferences.height,
        weight: preferences.weight,
        notes: preferences.notes,
      })
      .where(eq(customerSizePreferences.id, existing[0].id));
  } else {
    await db.insert(customerSizePreferences).values({
      userId,
      boutiqueId,
      bodySize,
      clothingType,
      preferredSize: preferences.preferredSize,
      bodyType: preferences.bodyType,
      height: preferences.height,
      weight: preferences.weight,
      notes: preferences.notes,
    });
  }
}

/**
 * Get customer's saved size preferences
 */
export async function getCustomerPreferences(
  userId: number,
  boutiqueId: number,
  clothingType: string
): Promise<any | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const prefs = await db
    .select()
    .from(customerSizePreferences)
    .where(
      and(
        eq(customerSizePreferences.userId, userId),
        eq(customerSizePreferences.boutiqueId, boutiqueId),
        eq(customerSizePreferences.clothingType, clothingType)
      )
    )
    .limit(1);

  return prefs.length ? prefs[0] : null;
}

/**
 * Mark a review as helpful
 */
export async function markReviewHelpful(reviewId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(sizeReviews)
    .set({
      helpfulCount: sql`${sizeReviews.helpfulCount} + 1`,
    })
    .where(eq(sizeReviews.id, reviewId));
}

/**
 * Mark a review as unhelpful
 */
export async function markReviewUnhelpful(reviewId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(sizeReviews)
    .set({
      unhelpfulCount: sql`${sizeReviews.unhelpfulCount} + 1`,
    })
    .where(eq(sizeReviews.id, reviewId));
}

/**
 * Get size fit statistics for a specific size
 */
export async function getSizeFitStats(
  clothingType: string,
  selectedSize: number
): Promise<{
  tight: number;
  perfect: number;
  loose: number;
  totalReviews: number;
  averageRating: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const reviews = await db
    .select()
    .from(sizeReviews)
    .where(
      and(
        eq(sizeReviews.clothingType, clothingType),
        eq(sizeReviews.selectedSize, selectedSize)
      )
    );

  let stats = {
    tight: 0,
    perfect: 0,
    loose: 0,
    totalReviews: reviews.length,
    averageRating: 0,
  };

  let totalRating = 0;

  for (const review of reviews) {
    if (review.fitRating === "tight") stats.tight++;
    else if (review.fitRating === "perfect") stats.perfect++;
    else if (review.fitRating === "loose") stats.loose++;
    
    if (review.helpfulnessRating) {
      totalRating += review.helpfulnessRating;
    }
  }

  if (stats.totalReviews > 0) {
    stats.averageRating = Math.round((totalRating / stats.totalReviews) * 10) / 10;
  }

  return stats;
}
