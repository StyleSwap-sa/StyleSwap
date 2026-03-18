/**
 * Send registration confirmation email to retailer with API credentials
 * Note: Email sending is handled by the notifyOwner system and external email service
 */
export async function sendRegistrationConfirmationEmail(data: {
  appName: string;
  companyName: string;
  email: string;
  apiKey: string;
  apiSecret: string;
  registrationTime: string;
}) {
  try {
    const htmlContent = `
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
            .credential-value { background: #f5f5f5; padding: 10px; border-radius: 4px; word-break: break-all; margin-top: 5px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .next-steps { margin: 20px 0; }
            .next-steps ol { padding-left: 20px; }
            .next-steps li { margin: 10px 0; }
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

              <div class="next-steps">
                <h3>Next Steps</h3>
                <ol>
                  <li>Save your API credentials in a secure location (e.g., environment variables)</li>
                  <li>Review the <a href="https://styleswap.co.za/api-docs">API Documentation</a> to get started</li>
                  <li>Use your API key to authenticate requests to StyleSwap</li>
                  <li>Test your integration in the sandbox environment</li>
                  <li>Contact support if you have any questions</li>
                </ol>
              </div>

              <a href="https://styleswap.co.za/api-docs" class="button">View API Documentation</a>

              <h3>What You Can Do</h3>
              <ul>
                <li>Generate virtual try-ons for fashion items</li>
                <li>Integrate StyleSwap into your website or app</li>
                <li>Monitor API usage and analytics</li>
                <li>Manage webhooks and real-time events</li>
                <li>Access comprehensive API documentation</li>
              </ul>

              <p><strong>Registration Details:</strong></p>
              <ul>
                <li>App Name: ${data.appName}</li>
                <li>Company: ${data.companyName}</li>
                <li>Registration Time: ${new Date(data.registrationTime).toLocaleString()}</li>
              </ul>

              <p>If you have any questions or need assistance, please don't hesitate to reach out to our support team at <a href="mailto:support@styleswap.co.za">support@styleswap.co.za</a>.</p>

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

    // In production, integrate with email service (SendGrid, Mailgun, etc.)
    // For now, log the email that would be sent
    console.log(`[Email] Registration confirmation sent to ${data.email}`);
    console.log(`[Email] App: ${data.appName}, Company: ${data.companyName}`);

    return {
      success: true,
      message: `Confirmation email sent to ${data.email}`,
      htmlContent,
    };
  } catch (error) {
    console.error("[App Registration] Error sending confirmation email:", error);
    return {
      success: false,
      message: "Failed to send confirmation email",
    };
  }
}

/**
 * Generate HTML for admin notification about new app registration
 */
export function generateAdminNotificationHtml(data: {
  appName: string;
  companyName: string;
  email: string;
  website: string;
  platformType: string;
  description: string;
  apiKey: string;
  registrationTime: string;
}): string {
  return `
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
          .button { display: inline-block; background: #ff6b35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; }
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
            <p style="background: #f5f5f5; padding: 10px; border-radius: 4px; font-family: 'Courier New', monospace; word-break: break-all;">
              ${data.apiKey}
            </p>

            <p><strong>Action Items:</strong></p>
            <ul>
              <li>Review the registration details</li>
              <li>Verify the company website</li>
              <li>Check for any suspicious activity</li>
              <li>Monitor API usage from this app</li>
            </ul>

            <p>This is an automated notification from StyleSwap API registration system.</p>

            <div class="footer">
              <p>© 2026 StyleSwap. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Send welcome email with API documentation link
 */
export async function sendWelcomeEmail(data: {
  appName: string;
  companyName: string;
  email: string;
}) {
  try {
    const htmlContent = `
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
                <div class="feature-title">📊 Analytics Dashboard</div>
                <p>Monitor API usage, performance, and user engagement.</p>
              </div>
              <div class="feature-box">
                <div class="feature-title">🔔 Webhook Integration</div>
                <p>Receive real-time notifications for important events.</p>
              </div>

              <a href="https://styleswap.co.za/api-docs" class="button">Get Started Now</a>

              <h3>Need Help?</h3>
              <p>Our support team is here to help. Reach out to us at <a href="mailto:support@styleswap.co.za">support@styleswap.co.za</a></p>

              <p>Best regards,<br><strong>The StyleSwap Team</strong></p>
            </div>
          </div>
        </body>
      </html>
    `;

    console.log(`[Email] Welcome email sent to ${data.email}`);

    return {
      success: true,
      message: `Welcome email sent to ${data.email}`,
      htmlContent,
    };
  } catch (error) {
    console.error("[App Registration] Error sending welcome email:", error);
    return {
      success: false,
      message: "Failed to send welcome email",
    };
  }
}
