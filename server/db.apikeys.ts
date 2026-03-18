import { getDb } from './db';
import { apiKeys, apiKeyLogs } from '../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import crypto from 'crypto';

/**
 * Generate a new API key with secure random string
 * Format: sk_live_<random> or sk_test_<random>
 */
export function generateApiKey(prefix: 'live' | 'test' = 'live'): { key: string; maskedKey: string } {
  const randomBytes = crypto.randomBytes(32).toString('hex');
  const key = `sk_${prefix}_${randomBytes}`;
  
  // Mask the key: show first 8 and last 4 characters
  const maskedKey = `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
  
  return { key, maskedKey };
}

/**
 * Create a new API key for a boutique
 */
export async function createApiKey(
  boutiqueId: number,
  name: string,
  prefix: 'live' | 'test' = 'live'
) {
  const db = await getDb();
  if (!db) {
    throw new Error('Database connection unavailable');
  }

  try {
    const { key, maskedKey } = generateApiKey(prefix);

    const result = await db.insert(apiKeys).values({
      boutiqueId,
      name,
      key,
      maskedKey,
      status: 'active',
      requestsCount: 0,
      createdAt: new Date().toISOString(),
    });

    // Return the full key only once (on creation)
    return {
      id: result[0],
      boutiqueId,
      name,
      key, // Full key - only shown once
      maskedKey,
      status: 'active' as const,
      requestsCount: 0,
      createdAt: new Date(),
    };
  } catch (error) {
    console.error('[DB] Failed to create API key:', error);
    throw error;
  }
}

/**
 * Get all API keys for a boutique
 */
export async function getApiKeysByBoutique(boutiqueId: number) {
  const db = await getDb();
  if (!db) {
    return [];
  }

  try {
    const keys = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.boutiqueId, boutiqueId))
      .orderBy(desc(apiKeys.createdAt));

    return keys.map(key => ({
      id: key.id,
      boutiqueId: key.boutiqueId,
      name: key.name,
      maskedKey: key.maskedKey,
      status: key.status,
      requestsCount: key.requestsCount,
      createdAt: key.createdAt ? new Date(key.createdAt) : new Date(),
      lastUsedAt: key.lastUsedAt ? new Date(key.lastUsedAt) : null,
      revokedAt: key.revokedAt ? new Date(key.revokedAt) : null,
    }));
  } catch (error) {
    console.error('[DB] Failed to get API keys:', error);
    return [];
  }
}

/**
 * Get a single API key by ID (without full key)
 */
export async function getApiKeyById(keyId: number) {
  const db = await getDb();
  if (!db) {
    return null;
  }

  try {
    const result = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.id, keyId))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const key = result[0];
    return {
      id: key.id,
      boutiqueId: key.boutiqueId,
      name: key.name,
      maskedKey: key.maskedKey,
      status: key.status,
      requestsCount: key.requestsCount,
      createdAt: key.createdAt ? new Date(key.createdAt) : new Date(),
      lastUsedAt: key.lastUsedAt ? new Date(key.lastUsedAt) : null,
      revokedAt: key.revokedAt ? new Date(key.revokedAt) : null,
    };
  } catch (error) {
    console.error('[DB] Failed to get API key:', error);
    return null;
  }
}

/**
 * Get API key by the actual key string (for authentication)
 */
export async function getApiKeyByKey(keyString: string) {
  const db = await getDb();
  if (!db) {
    return null;
  }

  try {
    const result = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.key, keyString))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return result[0];
  } catch (error) {
    console.error('[DB] Failed to get API key by string:', error);
    return null;
  }
}

/**
 * Update API key name
 */
export async function updateApiKeyName(keyId: number, name: string) {
  const db = await getDb();
  if (!db) {
    throw new Error('Database connection unavailable');
  }

  try {
    await db
      .update(apiKeys)
      .set({ name })
      .where(eq(apiKeys.id, keyId));

    return true;
  } catch (error) {
    console.error('[DB] Failed to update API key name:', error);
    throw error;
  }
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(keyId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error('Database connection unavailable');
  }

  try {
    await db
      .update(apiKeys)
      .set({
        status: 'revoked',
        revokedAt: new Date().toISOString(),
      })
      .where(eq(apiKeys.id, keyId));

    return true;
  } catch (error) {
    console.error('[DB] Failed to revoke API key:', error);
    throw error;
  }
}

/**
 * Update last used timestamp for an API key
 */
export async function updateApiKeyLastUsed(keyId: number) {
  const db = await getDb();
  if (!db) {
    return false;
  }

  try {
    await db
      .update(apiKeys)
      .set({
        lastUsedAt: new Date().toISOString(),
        requestsCount: sql`requestsCount + 1`,
      })
      .where(eq(apiKeys.id, keyId));

    return true;
  } catch (error) {
    console.error('[DB] Failed to update API key last used:', error);
    return false;
  }
}

/**
 * Get API key usage statistics
 */
export async function getApiKeyStats(keyId: number) {
  const db = await getDb();
  if (!db) {
    return null;
  }

  try {
    // Get the API key
    const keyResult = await db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.id, keyId))
      .limit(1);

    if (keyResult.length === 0) {
      return null;
    }

    const key = keyResult[0];

    // Get logs from last 24 hours
    const dayStart = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const logsLast24h = await db
      .select()
      .from(apiKeyLogs)
      .where(
        and(
          eq(apiKeyLogs.apiKeyId, keyId),
          sql`${apiKeyLogs.createdAt} >= ${dayStart.toISOString()}`
        )
      );

    // Calculate statistics
    const responseTimes = logsLast24h
      .filter(log => log.responseTime !== null && log.responseTime !== undefined)
      .map(log => log.responseTime as number);

    const avgResponseTime = responseTimes.length > 0
      ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
      : 0;

    const errorCount = logsLast24h.filter(log => log.statusCode >= 400).length;
    const successCount = logsLast24h.filter(log => log.statusCode < 400).length;

    return {
      keyId,
      totalRequests: key.requestsCount,
      requestsLast24h: logsLast24h.length,
      successCount,
      errorCount,
      avgResponseTime,
      lastUsedAt: key.lastUsedAt ? new Date(key.lastUsedAt) : null,
    };
  } catch (error) {
    console.error('[DB] Failed to get API key stats:', error);
    return null;
  }
}
