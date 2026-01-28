import { randomBytes } from 'crypto';
import { invokeLLM } from './llm';

/**
 * Generate a secure email verification token
 */
export function generateVerificationToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Calculate token expiry time (24 hours from now)
 */
export function getTokenExpiry(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24);
  return expiry;
}

/**
 * Send verification email to user
 */
export async function sendVerificationEmail(
  email: string,
  name: string | null,
  verificationToken: string,
  baseUrl: string
): Promise<boolean> {
  try {
    const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
    const userName = name || email.split('@')[0];

    // Use the LLM to generate a professional email
    const emailContent = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'You are an email template generator. Generate a professional HTML email for email verification. Return only the HTML content without any markdown formatting or code blocks.'
        },
        {
          role: 'user',
          content: `Generate a professional email verification email for StyleSwap. 
          
User name: ${userName}
Verification URL: ${verificationUrl}
Company: StyleSwap - AI-powered virtual try-on platform

The email should:
1. Welcome the user to StyleSwap
2. Explain why email verification is important
3. Include a clear call-to-action button linking to the verification URL
4. Include the verification URL as a fallback link
5. Be professional and branded for StyleSwap
6. Include footer with company info

Return only valid HTML email content.`
        }
      ]
    });

    const htmlContent = emailContent.choices[0].message.content;

    // Send email using Manus notification system
    const response = await fetch(`${process.env.BUILT_IN_FORGE_API_URL}/notification/send-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.BUILT_IN_FORGE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: email,
        subject: 'Verify your StyleSwap email address',
        html: htmlContent,
        text: `Welcome to StyleSwap! Please verify your email by visiting: ${verificationUrl}`
      })
    });

    if (!response.ok) {
      console.error('[Email Verification] Failed to send email:', await response.text());
      return false;
    }

    console.log('[Email Verification] Verification email sent to:', email);
    return true;
  } catch (error) {
    console.error('[Email Verification] Error sending verification email:', error);
    return false;
  }
}

/**
 * Send resend verification email
 */
export async function sendResendVerificationEmail(
  email: string,
  name: string | null,
  verificationToken: string,
  baseUrl: string
): Promise<boolean> {
  try {
    const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
    const userName = name || email.split('@')[0];

    const emailContent = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: 'You are an email template generator. Generate a professional HTML email for email verification resend. Return only the HTML content.'
        },
        {
          role: 'user',
          content: `Generate a resend verification email for StyleSwap.
          
User name: ${userName}
Verification URL: ${verificationUrl}

The email should:
1. Apologize for the resend
2. Provide the new verification link
3. Mention that the link expires in 24 hours
4. Be professional and concise
5. Include footer with company info

Return only valid HTML email content.`
        }
      ]
    });

    const htmlContent = emailContent.choices[0].message.content;

    const response = await fetch(`${process.env.BUILT_IN_FORGE_API_URL}/notification/send-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.BUILT_IN_FORGE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: email,
        subject: 'Resend: Verify your StyleSwap email address',
        html: htmlContent,
        text: `Verify your StyleSwap email by visiting: ${verificationUrl}`
      })
    });

    if (!response.ok) {
      console.error('[Email Verification] Failed to send resend email:', await response.text());
      return false;
    }

    console.log('[Email Verification] Resend verification email sent to:', email);
    return true;
  } catch (error) {
    console.error('[Email Verification] Error sending resend email:', error);
    return false;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(expiryDate: Date | string | null): boolean {
  if (!expiryDate) return true;
  const expiry = new Date(expiryDate);
  return expiry < new Date();
}
