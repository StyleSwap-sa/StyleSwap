import type { Request } from 'express';
import * as db from '../db';
import type { User } from '../../drizzle/schema';
import { sdk } from './sdk';
import { COOKIE_NAME } from '@shared/const';

/**
 * Extract authenticated user from JWT session cookie or Clerk request
 */
export async function getAuthUser(req: Request): Promise<User | null> {
  try {
    // First, try to verify JWT session cookie
    const sessionCookie = req.cookies?.[COOKIE_NAME];
    if (sessionCookie) {
      const session = await sdk.verifySession(sessionCookie);
      if (session?.openId) {
        const user = await db.getUserByOpenId(session.openId);
        if (user) return user;
      }
    }

    // Fall back to Clerk authentication
    const auth = (req as any).auth;
    if (!auth?.userId) return null;
    
    const clerkId = auth.userId;
    
    // Get existing user from database
    let user = await db.getUserByClerkId(clerkId);
    
    if (user) return user;
    
    // Create new user from Clerk data if not exists
    const clerkUser = (req as any).user;
    if (!clerkUser) return null;
    
    const email = clerkUser.emailAddresses?.[0]?.emailAddress || '';
    const firstName = clerkUser.firstName || '';
    const lastName = clerkUser.lastName || '';
    const name = `${firstName} ${lastName}`.trim();
    
    user = await db.upsertUser({
      clerkId,
      email,
      name: name || email,
    });
    
    return user;
  } catch (error) {
    console.error('[Auth] Error getting auth user:', error);
    return null;
  }
}

/**
 * Verify Clerk token from request
 * Used for API authentication
 */
export function getClerkUserId(req: Request): string | null {
  try {
    const auth = (req as any).auth;
    return auth?.userId || null;
  } catch (error) {
    console.error('[Auth] Error getting Clerk user ID:', error);
    return null;
  }
}
