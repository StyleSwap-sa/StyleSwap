/**
 * Twilio OTP Integration
 * Handles OTP verification using Twilio Verify v2 API
 * 
 * Security Notes:
 * - All OTP codes are generated and verified by Twilio
 * - We do NOT store OTP codes locally
 * - Rate limiting is enforced per phone number
 * - All credentials are stored in environment variables
 */

import twilio from 'twilio';
import { TRPCError } from '@trpc/server';

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Get the Twilio Verify service SID from environment
const VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;

if (!VERIFY_SERVICE_SID) {
  console.warn('TWILIO_VERIFY_SERVICE_SID not configured. OTP features will be unavailable.');
}

/**
 * Validate phone number format
 * Accepts E.164 format (+1234567890) or standard formats
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
  // E.164 format: +[1-9]{1}[0-9]{1,14}
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phoneNumber);
}

/**
 * Normalize phone number to E.164 format
 * Assumes South African numbers if no country code provided
 */
export function normalizePhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters except leading +
  let cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // If it doesn't start with +, assume it's a South African number
  if (!cleaned.startsWith('+')) {
    // If it starts with 0, replace with +27
    if (cleaned.startsWith('0')) {
      cleaned = '+27' + cleaned.substring(1);
    } else if (!cleaned.startsWith('27')) {
      // If it doesn't have country code, add +27
      cleaned = '+27' + cleaned;
    } else {
      cleaned = '+' + cleaned;
    }
  }
  
  return cleaned;
}

/**
 * Send OTP via Twilio Verify
 * Returns the verification SID for later verification
 */
export async function sendOTP(phoneNumber: string): Promise<{ verificationSid: string }> {
  if (!VERIFY_SERVICE_SID) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'OTP service is not configured',
    });
  }

  const normalizedPhone = normalizePhoneNumber(phoneNumber);

  if (!validatePhoneNumber(normalizedPhone)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Invalid phone number format',
    });
  }

  try {
    const verification = await twilioClient.verify.v2
      .services(VERIFY_SERVICE_SID)
      .verifications.create({
        to: normalizedPhone,
        channel: 'sms',
      });

    return {
      verificationSid: verification.sid,
    };
  } catch (error: any) {
    console.error('Twilio OTP send error:', error);
    
    // Handle specific Twilio errors
    if (error.code === 20003) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid phone number',
      });
    }
    
    if (error.code === 60203) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: 'Too many OTP requests. Please try again later.',
      });
    }

    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to send OTP. Please try again.',
    });
  }
}

/**
 * Verify OTP code
 * Returns true if verification succeeds
 */
export async function verifyOTP(
  phoneNumber: string,
  code: string
): Promise<boolean> {
  if (!VERIFY_SERVICE_SID) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'OTP service is not configured',
    });
  }

  const normalizedPhone = normalizePhoneNumber(phoneNumber);

  if (!validatePhoneNumber(normalizedPhone)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Invalid phone number format',
    });
  }

  // Validate code format (should be 6 digits typically)
  if (!/^\d{4,8}$/.test(code)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Invalid OTP code format',
    });
  }

  try {
    const verificationCheck = await twilioClient.verify.v2
      .services(VERIFY_SERVICE_SID)
      .verificationChecks.create({
        to: normalizedPhone,
        code: code,
      });

    if (verificationCheck.status === 'approved') {
      return true;
    }

    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Invalid or expired OTP code',
    });
  } catch (error: any) {
    console.error('Twilio OTP verification error:', error);

    if (error.code === 20003) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid phone number',
      });
    }

    if (error.status === 404 || error.code === 60202) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired OTP code',
      });
    }

    // If it's already a TRPCError, re-throw it
    if (error instanceof TRPCError) {
      throw error;
    }

    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to verify OTP. Please try again.',
    });
  }
}

/**
 * Get Twilio client for advanced operations
 */
export function getTwilioClient() {
  return twilioClient;
}
