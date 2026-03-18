import { ENV } from "./_core/env";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Send email using SendGrid API
 * Requires SENDGRID_API_KEY environment variable
 */
export async function sendEmail(options: EmailOptions): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    // Check if SendGrid API key is configured
    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    if (!sendgridApiKey) {
      console.warn("[Email] SendGrid API key not configured. Email not sent.");
      console.log(`[Email] Would send to: ${options.to}`);
      console.log(`[Email] Subject: ${options.subject}`);
      return {
        success: false,
        error: "SendGrid API key not configured",
      };
    }

    const fromEmail = options.from || "noreply@styleswap.co.za";

    // Call SendGrid API
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sendgridApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: options.to }],
            subject: options.subject,
          },
        ],
        from: {
          email: fromEmail,
          name: "StyleSwap",
        },
        content: [
          {
            type: "text/html",
            value: options.html,
          },
        ],
        reply_to: {
          email: "support@styleswap.co.za",
          name: "StyleSwap Support",
        },
        tracking_settings: {
          click_tracking: {
            enable: true,
          },
          open_tracking: {
            enable: true,
          },
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`[Email] SendGrid error: ${response.status} - ${error}`);
      return {
        success: false,
        error: `SendGrid API error: ${response.status}`,
      };
    }

    const messageId = response.headers.get("x-message-id") || "unknown";
    console.log(`[Email] ✓ Email sent successfully to ${options.to} (ID: ${messageId})`);

    return {
      success: true,
      messageId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Email] Error sending email: ${errorMessage}`);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send registration confirmation email to retailer
 */
export async function sendRegistrationConfirmationEmail(data: {
  email: string;
  appName: string;
  companyName: string;
  apiKey: string;
  apiSecret: string;
  registrationTime: string;
}): Promise<{ success: boolean; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .credentials-box { background: white; border: 2px solid #e0e0e0; padding: 20px; border-radius: 6px; margin: 20px 0; font-family: 'Courier New', monospace; }
          .credential-item { margin: 15px 0; }
          .credential-label { font-weight: bold; color: #666; font-size: 12px; text-transform: uppercase; }
          .credential-value { background: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all; margin-top: 5px; font-size: 13px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
          .button { display: inline-block; background: #ff6b35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to StyleSwap API!</h1>
            <p>Your application has been registered successfully</p>
          </div>
          <div class="content">
            <p>Hi <strong>${data.companyName}</strong>,</p>
            <p>Thank you for registering <strong>${data.appName}</strong> with StyleSwap. Your API credentials have been generated and are ready to use immediately.</p>
            
            <div class="credentials-box">
              <div class="credential-item">
                <div class="credential-label">API Key</div>
                <div class="credential-value">${data.apiKey}</div>
              </div>
              <div class="credential-item">
                <div class="credential-label">API Secret</div>
                <div class="credential-value">${data.apiSecret}</div>
              </div>
            </div>

            <div class="warning">
              <strong>⚠️ Important:</strong> Store your API secret in a secure location. You won't be able to view it again. Never share your API secret with anyone.
            </div>

            <h3>Next Steps</h3>
            <ol>
              <li>Save your API credentials in a secure location (e.g., environment variables)</li>
              <li>Review the <a href="https://styleswap.co.za/api-docs">API Documentation</a> to get started</li>
              <li>Use your API key to authenticate requests to StyleSwap</li>
              <li>Test your integration in the sandbox environment</li>
              <li>Contact support if you have any questions</li>
            </ol>

            <a href="https://styleswap.co.za/api-docs" class="button">View API Documentation</a>

            <p>If you have any questions or need assistance, reach out to our support team at <a href="mailto:support@styleswap.co.za">support@styleswap.co.za</a>.</p>

            <p>Best regards,<br><strong>The StyleSwap Team</strong></p>

            <div class="footer">
              <p>© 2026 StyleSwap. All rights reserved.</p>
              <p><a href="https://styleswap.co.za/privacy">Privacy Policy</a> | <a href="https://styleswap.co.za/terms">Terms of Service</a></p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return await sendEmail({
    to: data.email,
    subject: `API Credentials for ${data.appName} - StyleSwap`,
    html,
  });
}

/**
 * Send welcome email with quick start guide
 */
export async function sendWelcomeEmail(data: {
  email: string;
  appName: string;
  companyName: string;
}): Promise<{ success: boolean; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .feature-box { background: white; border: 1px solid #e0e0e0; padding: 15px; border-radius: 4px; margin: 10px 0; }
          .feature-title { font-weight: bold; color: #ff6b35; }
          .button { display: inline-block; background: #ff6b35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to StyleSwap API! 🚀</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${data.companyName}</strong>,</p>
            <p>We're excited to have <strong>${data.appName}</strong> on the StyleSwap platform!</p>

            <h3>Quick Start Guide</h3>
            <div class="feature-box">
              <div class="feature-title">📚 API Documentation</div>
              <p>Complete reference for all API endpoints, authentication, and examples.</p>
            </div>
            <div class="feature-box">
              <div class="feature-title">🧪 Sandbox Environment</div>
              <p>Test your integration safely before going live.</p>
            </div>
            <div class="feature-box">
              <div class="feature-title">📊 Developer Dashboard</div>
              <p>Monitor API usage, performance, and manage your credentials.</p>
            </div>
            <div class="feature-box">
              <div class="feature-title">🔔 Webhook Integration</div>
              <p>Receive real-time notifications for important events.</p>
            </div>

            <a href="https://styleswap.co.za/api-docs" class="button">Get Started Now</a>

            <h3>Need Help?</h3>
            <p>Our support team is here to help. Reach out to us at <a href="mailto:support@styleswap.co.za">support@styleswap.co.za</a></p>

            <p>Best regards,<br><strong>The StyleSwap Team</strong></p>

            <div class="footer">
              <p>© 2026 StyleSwap. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return await sendEmail({
    to: data.email,
    subject: `Welcome to StyleSwap API - ${data.appName}`,
    html,
  });
}

/**
 * Send email to admin about new registration
 */
export async function sendAdminRegistrationNotification(data: {
  appName: string;
  companyName: string;
  email: string;
  website: string;
  platformType: string;
  description: string;
  apiKey: string;
  registrationTime: string;
}): Promise<{ success: boolean; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; border: 2px solid #e0e0e0; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .info-row { display: flex; margin: 10px 0; }
          .info-label { font-weight: bold; width: 150px; color: #666; }
          .info-value { flex: 1; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📱 New App Registration</h1>
            <p>A new developer has registered with StyleSwap API</p>
          </div>
          <div class="content">
            <p>A new application has been registered on StyleSwap API.</p>
            
            <div class="info-box">
              <div class="info-row">
                <div class="info-label">App Name:</div>
                <div class="info-value"><strong>${data.appName}</strong></div>
              </div>
              <div class="info-row">
                <div class="info-label">Company:</div>
                <div class="info-value"><strong>${data.companyName}</strong></div>
              </div>
              <div class="info-row">
                <div class="info-label">Email:</div>
                <div class="info-value"><a href="mailto:${data.email}">${data.email}</a></div>
              </div>
              <div class="info-row">
                <div class="info-label">Website:</div>
                <div class="info-value"><a href="${data.website}" target="_blank">${data.website}</a></div>
              </div>
              <div class="info-row">
                <div class="info-label">Platform:</div>
                <div class="info-value"><strong>${data.platformType}</strong></div>
              </div>
              <div class="info-row">
                <div class="info-label">Registration:</div>
                <div class="info-value">${new Date(data.registrationTime).toLocaleString()}</div>
              </div>
            </div>

            <h3>Use Case Description</h3>
            <p style="background: #f5f5f5; padding: 15px; border-radius: 4px; border-left: 4px solid #ff6b35;">
              ${data.description}
            </p>

            <h3>API Key</h3>
            <p style="background: #f5f5f5; padding: 10px; border-radius: 4px; font-family: 'Courier New', monospace; word-break: break-all; font-size: 12px;">
              ${data.apiKey}
            </p>

            <p><strong>Action Items:</strong></p>
            <ul>
              <li>Review the registration details</li>
              <li>Verify the company website</li>
              <li>Check for any suspicious activity</li>
              <li>Monitor API usage from this app</li>
            </ul>

            <div class="footer">
              <p>© 2026 StyleSwap. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  // Send to admin email
  const adminEmail = process.env.ADMIN_EMAIL || "admin@styleswap.co.za";
  return await sendEmail({
    to: adminEmail,
    subject: `[New Registration] ${data.appName} by ${data.companyName}`,
    html,
  });
}
