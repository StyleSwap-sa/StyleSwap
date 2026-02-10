import { notifyOwner } from "../_core/notification";
import { getDb } from "../db";
import { users, boutiques } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Verification Email Service
 * Sends automated emails to boutiques at each stage of the verification process
 */

export interface VerificationEmailData {
  boutiqueId: number;
  boutiqueName: string;
  ownerEmail: string;
  ownerName: string;
  verificationId: number;
  trustScore?: number;
  rejectionReason?: string;
  adminNotes?: string;
}

/**
 * Send verification submitted confirmation email
 */
export async function sendVerificationSubmittedEmail(data: VerificationEmailData) {
  const emailContent = `
    <h2>Verification Submitted Successfully</h2>
    <p>Hi ${data.ownerName},</p>
    <p>Thank you for submitting your boutique for verification. We've received your application and our team will review it within 2-5 business days.</p>
    
    <h3>What's Next?</h3>
    <ul>
      <li>Our team will review all submitted documents</li>
      <li>We may request additional information if needed</li>
      <li>You'll receive an email notification once the review is complete</li>
    </ul>
    
    <h3>Verification Details</h3>
    <p><strong>Boutique:</strong> ${data.boutiqueName}</p>
    <p><strong>Verification ID:</strong> ${data.verificationId}</p>
    <p><strong>Submitted:</strong> ${new Date().toLocaleDateString()}</p>
    
    <h3>Need Help?</h3>
    <p>If you have any questions about the verification process, please contact our support team.</p>
    
    <p>Best regards,<br/>StyleSwap Team</p>
  `;

  await sendEmailNotification({
    to: data.ownerEmail,
    subject: "Boutique Verification Submitted - StyleSwap",
    content: emailContent,
    boutiqueId: data.boutiqueId,
  });

  // Notify platform owner
  await notifyOwner({
    title: "New Boutique Verification Submitted",
    content: `${data.boutiqueName} (${data.ownerEmail}) has submitted their boutique for verification.`,
  });
}

/**
 * Send verification approved email
 */
export async function sendVerificationApprovedEmail(data: VerificationEmailData & { expiresAt: string }) {
  const emailContent = `
    <h2>Congratulations! Your Boutique is Verified</h2>
    <p>Hi ${data.ownerName},</p>
    <p>Great news! Your boutique has been successfully verified and approved by our team.</p>
    
    <h3>What This Means</h3>
    <ul>
      <li>✓ Your boutique now displays a verified badge</li>
      <li>✓ Customers can see your trust score (${data.trustScore}/100)</li>
      <li>✓ You're eligible for featured listing opportunities</li>
      <li>✓ You have access to priority support</li>
    </ul>
    
    <h3>Verification Details</h3>
    <p><strong>Boutique:</strong> ${data.boutiqueName}</p>
    <p><strong>Trust Score:</strong> ${data.trustScore}/100</p>
    <p><strong>Approved:</strong> ${new Date().toLocaleDateString()}</p>
    <p><strong>Verification Expires:</strong> ${new Date(data.expiresAt).toLocaleDateString()}</p>
    
    <h3>Next Steps</h3>
    <p>You can now:</p>
    <ul>
      <li>Start using our API to generate try-ons</li>
      <li>Embed the StyleSwap widget on your website</li>
      <li>Access your analytics dashboard</li>
      <li>Apply for featured listing placement</li>
    </ul>
    
    <p>Best regards,<br/>StyleSwap Team</p>
  `;

  await sendEmailNotification({
    to: data.ownerEmail,
    subject: "Your Boutique is Verified! - StyleSwap",
    content: emailContent,
    boutiqueId: data.boutiqueId,
  });

  // Notify platform owner
  await notifyOwner({
    title: "Boutique Verification Approved",
    content: `${data.boutiqueName} has been approved with a trust score of ${data.trustScore}/100.`,
  });
}

/**
 * Send verification rejected email
 */
export async function sendVerificationRejectedEmail(data: VerificationEmailData) {
  const emailContent = `
    <h2>Verification Application Status</h2>
    <p>Hi ${data.ownerName},</p>
    <p>Thank you for submitting your boutique for verification. Unfortunately, we were unable to approve your application at this time.</p>
    
    <h3>Reason for Rejection</h3>
    <p><strong>${data.rejectionReason || "Please see admin notes below"}</strong></p>
    
    ${data.adminNotes ? `<h3>Additional Details</h3><p>${data.adminNotes}</p>` : ""}
    
    <h3>What You Can Do</h3>
    <ul>
      <li>Review the rejection reason above</li>
      <li>Gather any missing or corrected documents</li>
      <li>Resubmit your application after 30 days</li>
      <li>Contact our support team if you have questions</li>
    </ul>
    
    <h3>Appeal Process</h3>
    <p>If you believe this decision was made in error, you can appeal within 14 days by replying to this email with additional evidence or documentation.</p>
    
    <p>We appreciate your interest in StyleSwap and hope to work with you in the future.</p>
    
    <p>Best regards,<br/>StyleSwap Team</p>
  `;

  await sendEmailNotification({
    to: data.ownerEmail,
    subject: "Boutique Verification Update - StyleSwap",
    content: emailContent,
    boutiqueId: data.boutiqueId,
  });

  // Notify platform owner
  await notifyOwner({
    title: "Boutique Verification Rejected",
    content: `${data.boutiqueName} verification was rejected. Reason: ${data.rejectionReason}`,
  });
}

/**
 * Send verification expiring soon reminder
 */
export async function sendVerificationExpiringReminderEmail(
  data: VerificationEmailData & { daysUntilExpiry: number }
) {
  const emailContent = `
    <h2>Your Verification is Expiring Soon</h2>
    <p>Hi ${data.ownerName},</p>
    <p>Your boutique verification will expire in ${data.daysUntilExpiry} days. To maintain your verified status, please renew your verification.</p>
    
    <h3>What You Need to Do</h3>
    <ol>
      <li>Log in to your StyleSwap account</li>
      <li>Go to Verification Settings</li>
      <li>Click "Renew Verification"</li>
      <li>Follow the renewal process (usually faster than initial verification)</li>
    </ol>
    
    <h3>Why Renew?</h3>
    <ul>
      <li>✓ Keep your verified badge</li>
      <li>✓ Maintain your trust score visibility</li>
      <li>✓ Continue accessing premium features</li>
      <li>✓ Stay eligible for featured listings</li>
    </ul>
    
    <p>If you don't renew by the expiration date, your verification status will be suspended and customers won't see your verified badge.</p>
    
    <p>Best regards,<br/>StyleSwap Team</p>
  `;

  await sendEmailNotification({
    to: data.ownerEmail,
    subject: "Renew Your Boutique Verification - StyleSwap",
    content: emailContent,
    boutiqueId: data.boutiqueId,
  });
}

/**
 * Send document verification request email
 */
export async function sendDocumentVerificationRequestEmail(
  data: VerificationEmailData & { missingDocuments: string[] }
) {
  const documentList = data.missingDocuments.map((doc) => `<li>${formatDocumentName(doc)}</li>`).join("");

  const emailContent = `
    <h2>Additional Documents Needed</h2>
    <p>Hi ${data.ownerName},</p>
    <p>We're reviewing your verification application and need a few more documents to complete the process.</p>
    
    <h3>Missing Documents</h3>
    <ul>
      ${documentList}
    </ul>
    
    <h3>How to Submit</h3>
    <ol>
      <li>Log in to your StyleSwap account</li>
      <li>Go to Verification Dashboard</li>
      <li>Upload the missing documents</li>
      <li>We'll review them within 2-3 business days</li>
    </ol>
    
    <h3>Document Requirements</h3>
    <ul>
      <li>Clear, legible copies (JPG, PNG, or PDF)</li>
      <li>Maximum file size: 10MB per document</li>
      <li>Must be current and valid</li>
      <li>Personal information should be visible</li>
    </ul>
    
    <p>If you have any questions about which documents to submit, please contact our support team.</p>
    
    <p>Best regards,<br/>StyleSwap Team</p>
  `;

  await sendEmailNotification({
    to: data.ownerEmail,
    subject: "Additional Documents Needed - StyleSwap Verification",
    content: emailContent,
    boutiqueId: data.boutiqueId,
  });
}

/**
 * Send fraud alert email
 */
export async function sendFraudAlertEmail(data: VerificationEmailData & { alertType: string; details: string }) {
  const emailContent = `
    <h2>Account Security Alert</h2>
    <p>Hi ${data.ownerName},</p>
    <p>We've detected unusual activity on your boutique account that requires attention.</p>
    
    <h3>Alert Type</h3>
    <p><strong>${data.alertType}</strong></p>
    
    <h3>Details</h3>
    <p>${data.details}</p>
    
    <h3>What Happens Next</h3>
    <ul>
      <li>Your account is under review by our fraud detection team</li>
      <li>You may be asked to provide additional verification</li>
      <li>Some features may be temporarily restricted</li>
      <li>We'll contact you within 24 hours with an update</li>
    </ul>
    
    <h3>If This Wasn't You</h3>
    <p>If you didn't authorize this activity, please:</p>
    <ol>
      <li>Change your password immediately</li>
      <li>Reply to this email to report the suspicious activity</li>
      <li>Contact our support team for assistance</li>
    </ol>
    
    <p>We take security seriously and appreciate your cooperation.</p>
    
    <p>Best regards,<br/>StyleSwap Security Team</p>
  `;

  await sendEmailNotification({
    to: data.ownerEmail,
    subject: "⚠️ Account Security Alert - StyleSwap",
    content: emailContent,
    boutiqueId: data.boutiqueId,
  });

  // Notify platform owner
  await notifyOwner({
    title: "Fraud Alert: Boutique Account",
    content: `Fraud alert for ${data.boutiqueName}: ${data.alertType} - ${data.details}`,
  });
}

/**
 * Send rate limit warning email
 */
export async function sendRateLimitWarningEmail(
  data: VerificationEmailData & { currentUsage: number; limit: number; percentage: number }
) {
  const emailContent = `
    <h2>API Rate Limit Warning</h2>
    <p>Hi ${data.ownerName},</p>
    <p>Your boutique is approaching its API rate limit for this billing period.</p>
    
    <h3>Current Usage</h3>
    <p><strong>${data.currentUsage} / ${data.limit} requests (${data.percentage}%)</strong></p>
    
    <h3>What This Means</h3>
    <p>Once you reach your limit, API requests will be temporarily blocked until the next billing cycle.</p>
    
    <h3>Your Options</h3>
    <ul>
      <li>Upgrade to a higher tier plan for more requests</li>
      <li>Optimize your API usage to reduce requests</li>
      <li>Contact sales for a custom plan</li>
    </ul>
    
    <h3>View Your Usage</h3>
    <p>Log in to your account and go to Analytics → API Usage to see detailed metrics.</p>
    
    <p>Best regards,<br/>StyleSwap Team</p>
  `;

  await sendEmailNotification({
    to: data.ownerEmail,
    subject: "API Rate Limit Warning - StyleSwap",
    content: emailContent,
    boutiqueId: data.boutiqueId,
  });
}

/**
 * Internal email notification function
 */
async function sendEmailNotification({
  to,
  subject,
  content,
  boutiqueId,
}: {
  to: string;
  subject: string;
  content: string;
  boutiqueId: number;
}) {
  try {
    // TODO: Integrate with actual email service (SendGrid, Mailgun, etc.)
    // For now, log to console and database
    console.log(`[Email] To: ${to}, Subject: ${subject}`);

    // Store in database for audit trail
    // const db = getDb();
    // await db.insert(emailNotifications).values({
    //   boutiqueId,
    //   type: 'verification_notification',
    //   subject,
    //   recipientEmail: to,
    //   status: 'sent',
    //   sentAt: new Date().toISOString(),
    // });
  } catch (error) {
    console.error(`[Email Error] Failed to send email to ${to}:`, error);
  }
}

/**
 * Format document name for display
 */
function formatDocumentName(docType: string): string {
  const names: Record<string, string> = {
    government_id: "Government ID",
    passport: "Passport",
    drivers_license: "Driver's License",
    business_license: "Business License",
    tax_registration: "Tax Registration",
    utility_bill: "Utility Bill",
    lease_agreement: "Lease Agreement",
    bank_statement: "Bank Statement",
    social_media_screenshot: "Social Media Screenshot",
    customer_testimonial: "Customer Testimonial",
  };

  return names[docType] || docType;
}

/**
 * Check for expiring verifications and send reminders
 * Should be run daily via cron job
 */
export async function checkExpiringVerifications() {
  const db = getDb();

  // Get verifications expiring in 30 days
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // TODO: Query for expiring verifications and send reminders
  // This would require a query to boutiqueVerifications table
  console.log("[Verification] Checking for expiring verifications...");
}
