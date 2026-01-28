import { z } from 'zod';
import { protectedProcedure, publicProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import {
  generateVerificationToken,
  getTokenExpiry,
  sendVerificationEmail,
  sendResendVerificationEmail,
  isTokenExpired
} from '../_core/emailVerification';
import { TRPCError } from '@trpc/server';

export const emailVerificationRouter = router({
  /**
   * Send verification email to user
   * Called after user signup
   */
  sendVerificationEmail: protectedProcedure
    .mutation(async ({ ctx }) => {
      try {
        const user = ctx.user;
        if (!user || !user.email) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'User email not found'
          });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database connection failed'
          });
        }

        // Generate verification token
        const verificationToken = generateVerificationToken();
        const tokenExpiry = getTokenExpiry();

        // Update user with verification token
        await db.update(users)
          .set({
            emailVerificationToken: verificationToken,
            emailVerificationTokenExpiry: tokenExpiry.toISOString()
          })
          .where(eq(users.id, user.id));

        // Send verification email
        const baseUrl = `${ctx.req.headers.origin || 'https://styleswap.com'}`;
        const emailSent = await sendVerificationEmail(
          user.email,
          user.name,
          verificationToken,
          baseUrl
        );

        if (!emailSent) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to send verification email'
          });
        }

        return {
          success: true,
          message: 'Verification email sent successfully'
        };
      } catch (error) {
        console.error('[Email Verification] Error sending verification email:', error);
        throw error;
      }
    }),

  /**
   * Resend verification email
   * Called when user requests to resend the verification email
   */
  resendVerificationEmail: protectedProcedure
    .mutation(async ({ ctx }) => {
      try {
        const user = ctx.user;
        if (!user || !user.email) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'User email not found'
          });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database connection failed'
          });
        }

        // Generate new verification token
        const verificationToken = generateVerificationToken();
        const tokenExpiry = getTokenExpiry();

        // Update user with new verification token
        await db.update(users)
          .set({
            emailVerificationToken: verificationToken,
            emailVerificationTokenExpiry: tokenExpiry.toISOString()
          })
          .where(eq(users.id, user.id));

        // Send resend verification email
        const baseUrl = `${ctx.req.headers.origin || 'https://styleswap.com'}`;
        const emailSent = await sendResendVerificationEmail(
          user.email,
          user.name,
          verificationToken,
          baseUrl
        );

        if (!emailSent) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to send verification email'
          });
        }

        return {
          success: true,
          message: 'Verification email resent successfully'
        };
      } catch (error) {
        console.error('[Email Verification] Error resending verification email:', error);
        throw error;
      }
    }),

  /**
   * Verify email with token
   * Called when user clicks verification link
   */
  verifyEmail: publicProcedure
    .input(z.object({
      token: z.string().min(1, 'Verification token is required')
    }))
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database connection failed'
          });
        }

        // Find user with this verification token
        const user = await db.select().from(users)
          .where(eq(users.emailVerificationToken, input.token))
          .limit(1)
          .then(rows => rows[0] || null);

        if (!user) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Invalid or expired verification token'
          });
        }

        // Check if token is expired
        if (isTokenExpired(user.emailVerificationTokenExpiry)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Verification token has expired. Please request a new one.'
          });
        }

        // Mark email as verified
        await db.update(users)
          .set({
            emailVerified: 1,
            emailVerificationToken: null,
            emailVerificationTokenExpiry: null
          })
          .where(eq(users.id, user.id));

        return {
          success: true,
          message: 'Email verified successfully',
          userId: user.id
        };
      } catch (error) {
        console.error('[Email Verification] Error verifying email:', error);
        throw error;
      }
    }),

  /**
   * Check if user's email is verified
   */
  isEmailVerified: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        const user = ctx.user;
        if (!user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database connection failed'
          });
        }

        const existingUser = await db.select().from(users)
          .where(eq(users.id, user.id))
          .limit(1)
          .then(rows => rows[0] || null);

        return {
          verified: existingUser?.emailVerified === 1,
          email: existingUser?.email
        };
      } catch (error) {
        console.error('[Email Verification] Error checking email verification status:', error);
        throw error;
      }
    })
});
