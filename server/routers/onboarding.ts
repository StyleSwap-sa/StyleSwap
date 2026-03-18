import { protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { getDb } from '../db';
import { apiKeys, onboardingStatus } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

export const onboardingRouter = {
  /**
   * Mark onboarding as completed for a retailer
   */
  completeOnboarding: protectedProcedure
    .input(z.object({
      apiKeyId: z.string(),
      webhookUrl: z.string().url().optional(),
      testsPassed: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      
      try {
        // Check if API key belongs to the current user
        const apiKey = await db
          .select()
          .from(apiKeys)
          .where(eq(apiKeys.id, input.apiKeyId))
          .limit(1);

        if (!apiKey || apiKey.length === 0) {
          throw new Error('API key not found');
        }

        if (apiKey[0].userId !== ctx.user.id) {
          throw new Error('Unauthorized: This API key does not belong to you');
        }

        // Check if onboarding status already exists
        const existing = await db
          .select()
          .from(onboardingStatus)
          .where(eq(onboardingStatus.apiKeyId, input.apiKeyId))
          .limit(1);

        const now = new Date();
        const completedData = {
          apiKeyId: input.apiKeyId,
          userId: ctx.user.id,
          step1Completed: true,
          step2Completed: true,
          step3Completed: input.testsPassed,
          step4Completed: true,
          webhookUrl: input.webhookUrl || null,
          testsPassed: input.testsPassed,
          completedAt: now,
          updatedAt: now,
        };

        if (existing && existing.length > 0) {
          // Update existing record
          await db
            .update(onboardingStatus)
            .set(completedData)
            .where(eq(onboardingStatus.apiKeyId, input.apiKeyId));
        } else {
          // Create new record
          await db.insert(onboardingStatus).values(completedData);
        }

        return {
          success: true,
          message: 'Onboarding completed successfully',
          completedAt: now,
        };
      } catch (error) {
        console.error('[Onboarding] Error completing onboarding:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to complete onboarding');
      }
    }),

  /**
   * Get onboarding status for a retailer
   */
  getOnboardingStatus: protectedProcedure
    .input(z.object({
      apiKeyId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      const db = getDb();

      try {
        // Check if API key belongs to the current user
        const apiKey = await db
          .select()
          .from(apiKeys)
          .where(eq(apiKeys.id, input.apiKeyId))
          .limit(1);

        if (!apiKey || apiKey.length === 0) {
          throw new Error('API key not found');
        }

        if (apiKey[0].userId !== ctx.user.id) {
          throw new Error('Unauthorized: This API key does not belong to you');
        }

        // Get onboarding status
        const status = await db
          .select()
          .from(onboardingStatus)
          .where(eq(onboardingStatus.apiKeyId, input.apiKeyId))
          .limit(1);

        if (!status || status.length === 0) {
          return {
            apiKeyId: input.apiKeyId,
            step1Completed: false,
            step2Completed: false,
            step3Completed: false,
            step4Completed: false,
            testsPassed: false,
            completedAt: null,
          };
        }

        return status[0];
      } catch (error) {
        console.error('[Onboarding] Error getting onboarding status:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to get onboarding status');
      }
    }),

  /**
   * Get all onboarding statuses for the current user
   */
  getAllOnboardingStatuses: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();

    try {
      const statuses = await db
        .select()
        .from(onboardingStatus)
        .where(eq(onboardingStatus.userId, ctx.user.id));

      return statuses;
    } catch (error) {
      console.error('[Onboarding] Error getting all onboarding statuses:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to get onboarding statuses');
    }
  }),

  /**
   * Update onboarding step progress
   */
  updateOnboardingStep: protectedProcedure
    .input(z.object({
      apiKeyId: z.string(),
      step: z.enum(['step1', 'step2', 'step3', 'step4']),
      completed: z.boolean(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      try {
        // Check if API key belongs to the current user
        const apiKey = await db
          .select()
          .from(apiKeys)
          .where(eq(apiKeys.id, input.apiKeyId))
          .limit(1);

        if (!apiKey || apiKey.length === 0) {
          throw new Error('API key not found');
        }

        if (apiKey[0].userId !== ctx.user.id) {
          throw new Error('Unauthorized: This API key does not belong to you');
        }

        const stepField = `${input.step}Completed` as const;
        const updateData: any = {
          [stepField]: input.completed,
          updatedAt: new Date(),
        };

        // Get or create onboarding status
        const existing = await db
          .select()
          .from(onboardingStatus)
          .where(eq(onboardingStatus.apiKeyId, input.apiKeyId))
          .limit(1);

        if (existing && existing.length > 0) {
          await db
            .update(onboardingStatus)
            .set(updateData)
            .where(eq(onboardingStatus.apiKeyId, input.apiKeyId));
        } else {
          const newStatus: any = {
            apiKeyId: input.apiKeyId,
            userId: ctx.user.id,
            step1Completed: false,
            step2Completed: false,
            step3Completed: false,
            step4Completed: false,
            testsPassed: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          newStatus[stepField] = input.completed;
          await db.insert(onboardingStatus).values(newStatus);
        }

        return {
          success: true,
          message: `${input.step} updated successfully`,
        };
      } catch (error) {
        console.error('[Onboarding] Error updating onboarding step:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to update onboarding step');
      }
    }),
};
