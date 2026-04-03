import { Request } from 'express';
import * as db from '../db';
import { verifyToken } from './jwt';
import { COOKIE_NAME } from '@shared/const';

export async function getUserFromRequest(req: Request) {
  const cookie = req.cookies?.[COOKIE_NAME];
  if (!cookie) return null;

  try {
    const decoded = verifyToken(cookie);
    const user = await db.getUserByOpenId(decoded.openId);
    return user || null;
  } catch (err) {
    console.warn('[Auth] Invalid token:', err);
    return null;
  }
}