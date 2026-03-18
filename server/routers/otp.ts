/**
 * OTP Authentication Router
 * Handles OTP-based authentication using Twilio Verify
 */

import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { sendOTP, verifyOTP, normalizePhoneNumber } from '../_core/twilio';
import { TRPCError } from '@trpc/server';
import { getDb } from '../db';
import { users as usersTable } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { getSessionCookieOptions } from '../_core/cookies';
import { COOKIE_NAME } from '@shared/const';

// In-memory rate limiting (for production, use Redis)
const otpAttempts = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting: max 3 OTP requests per phone number per 15 minutes
 */
function checkRateLimit(phoneNumber: string): void {
  const now = Date.now();
  const attempt = otpAttempts.get(phoneNumber);

  if (!attempt || now > attempt.resetTime) {
    // Reset the counter
    otpAttempts.set(phoneNumber, {
      count: 1,
      resetTime: now + 15 * 60 * 1000, // 15 minutes
    });
    return;
  }

  attempt.count++;

  if (attempt.count > 3) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many OTP requests. Please try again in 15 minutes.',
    });
  }
}

export const otpRouter = router({
  /**
   * Send OTP to phone number
   * Public endpoint - anyone can request an OTP
   */
  sendOTP: publicProcedure
    .input(
      z.object({
        phoneNumber: z.string().min(7).max(20),
      })
    )
    .mutation(async ({ input }) => {
      const { phoneNumber } = input;

      // Check rate limiting
      checkRateLimit(phoneNumber);

      // Send OTP via Twilio
      const result = await sendOTP(phoneNumber);

      return {
        success: true,
        message: 'OTP sent successfully',
        verificationSid: result.verificationSid,
      };
    }),

  /**
   * Verify OTP code and create session
   * Public endpoint - used for login
   */
  verifyOTP: publicProcedure
    .input(
      z.object({
        phoneNumber: z.string().min(7).max(20),
        code: z.string().min(4).max(8),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { phoneNumber, code } = input;

      // Verify OTP with Twilio
      const isValid = await verifyOTP(phoneNumber, code);

      if (!isValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired OTP code',
        });
      }

      // Normalize phone number
      const normalizedPhone = normalizePhoneNumber(phoneNumber);

      // Find or create user
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database connection unavailable',
        });
      }

      let user = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.phone, normalizedPhone))
        .then((rows) => rows[0]);

      if (!user) {
        // Create new user with phone number
        const result = await db
          .insert(usersTable)
          .values({
            phone: normalizedPhone,
            openId: `phone_${normalizedPhone.replace(/\D/g, '')}_${Date.now()}`,
            email: `phone_${normalizedPhone.replace(/\D/g, '')}@styleswap.local`, // Temporary email
            name: `User ${normalizedPhone}`,
            role: 'user',
            loginMethod: 'otp',
          })
          .returning();

        user = result[0];
      }

      // Create session cookie
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, user.id, {
        ...cookieOptions,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      return {
        success: true,
        message: 'OTP verified successfully',
        user: {
          id: user.id,
          phone: user.phone,
          email: user.email,
          name: user.name,
        },
      };
    }),

  /**
   * Get current OTP session info
   * Protected endpoint - requires authentication
   */
  getSessionInfo: protectedProcedure.query(async ({ ctx }) => {
    return {
      userId: ctx.user.id,
      phone: ctx.user.phone,
      email: ctx.user.email,
      name: ctx.user.name,
    };
  }),

  /**
   * Update phone number (requires OTP verification)
   * Protected endpoint - requires authentication
   */
  updatePhoneNumber: protectedProcedure
    .input(
      z.object({
        newPhoneNumber: z.string().min(7).max(20),
        code: z.string().min(4).max(8),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { newPhoneNumber, code } = input;

      // Verify OTP for new phone number
      const isValid = await verifyOTP(newPhoneNumber, code);

      if (!isValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired OTP code',
        });
      }

      // Normalize phone number
      const normalizedPhone = normalizePhoneNumber(newPhoneNumber);

      // Check if phone number is already in use
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database connection unavailable',
        });
      }

      const existingUser = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.phone, normalizedPhone))
        .then((rows) => rows[0]);

      if (existingUser && existingUser.id !== ctx.user.id) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Phone number is already in use',
        });
      }

      // Update user's phone number
      await db
        .update(usersTable)
        .set({ phone: normalizedPhone })
        .where(eq(usersTable.id, ctx.user.id));

      return {
        success: true,
        message: 'Phone number updated successfully',
        phone: normalizedPhone,
      };
    }),
});
