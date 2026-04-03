import jwt from 'jsonwebtoken';
import { ENV } from './env';

const JWT_SECRET = ENV.cookieSecret;
const JWT_EXPIRES_IN = '30d';

export function createToken(userId: number, openId: string): string {
  return jwt.sign({ sub: userId, openId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): { sub: number; openId: string } {
  return jwt.verify(token, JWT_SECRET) as any;
}