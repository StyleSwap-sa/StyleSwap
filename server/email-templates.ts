/**
 * Email templates for different inquiry types
 * Returns HTML email content for auto-responses
 */

export type InquiryType = 'general' | 'enterprise' | 'integration' | 'support';

interface EmailTemplate {
  subject: string;
  html: string;
}

const generateEmailTemplate = (
  inquiryType: InquiryType,
  customerName: string
): EmailTemplate => {
  const baseStyle = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    color: #1a1a1a;
    line-height: 1.6;
  `;

  const containerStyle = `
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    background-color: #f9f9f9;
  `;

  const headerStyle = `
    background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
    color: white;
    padding: 30px;
    text-align: center;
    border-radius: 8px 8px 0 0;
  `;

  const contentStyle = `
    background: white;
    padding: 30px;
    border-radius: 0 0 8px 8px;
  `;

  const templates: Record<InquiryType, EmailTemplate> = {
    general: {
      subject: 'Thank you for contacting StyleSwap',
      html: `
        <div style="${containerStyle}">
          <div style="${headerStyle}">
            <h1 style="margin: 0; font-size: 28px;">StyleSwap</h1>
            <p style="margin: 10px 0 0 0; font-size: 14px;">Thank you for your inquiry</p>
          </div>
          <div style="${contentStyle}">
            <p>Hi ${customerName},</p>
            <p>Thank you for reaching out to StyleSwap! We've received your inquiry and appreciate your interest in our virtual try-on technology.</p>
            <p><strong>What happens next:</strong></p>
            <ul>
              <li>Our team will review your message within 24 hours</li>
              <li>We'll respond with personalized information relevant to your needs</li>
              <li>If you have urgent questions, feel free to reach out to <a href="mailto:info@styleswap.co.za">info@styleswap.co.za</a></li>
            </ul>
            <p>In the meantime, you can explore our <a href="https://styleswap.co.za/pricing">pricing options</a> and <a href="https://styleswap.co.za/api-docs">API documentation</a>.</p>
            <p>Best regards,<br/>The StyleSwap Team</p>
          </div>
        </div>
      `,
    },
    enterprise: {
      subject: 'Enterprise Sales Inquiry - StyleSwap',
      html: `
        <div style="${containerStyle}">
          <div style="${headerStyle}">
            <h1 style="margin: 0; font-size: 28px;">StyleSwap</h1>
            <p style="margin: 10px 0 0 0; font-size: 14px;">Enterprise Sales Inquiry Received</p>
          </div>
          <div style="${contentStyle}">
            <p>Hi ${customerName},</p>
            <p>Thank you for your interest in StyleSwap's Enterprise Retail Pro package! We're excited to explore how our technology can transform your fashion retail business.</p>
            <p><strong>Your inquiry details:</strong></p>
            <ul>
              <li>Package: Enterprise Retail Pro</li>
              <li>Custom pricing & features</li>
              <li>Dedicated account manager</li>
              <li>Priority support & integration</li>
            </ul>
            <p><strong>Next steps:</strong></p>
            <ul>
              <li>Our enterprise sales team will contact you within 24 hours</li>
              <li>We'll schedule a personalized demo and consultation</li>
              <li>Custom pricing will be provided based on your specific needs</li>
            </ul>
            <p>For immediate assistance, contact our sales team at <a href="mailto:sales@styleswap.co.za">sales@styleswap.co.za</a></p>
            <p>Best regards,<br/>The StyleSwap Enterprise Team</p>
          </div>
        </div>
      `,
    },
    integration: {
      subject: 'API Integration Inquiry - StyleSwap',
      html: `
        <div style="${containerStyle}">
          <div style="${headerStyle}">
            <h1 style="margin: 0; font-size: 28px;">StyleSwap</h1>
            <p style="margin: 10px 0 0 0; font-size: 14px;">API Integration Inquiry Received</p>
          </div>
          <div style="${contentStyle}">
            <p>Hi ${customerName},</p>
            <p>Thank you for your interest in integrating StyleSwap's API into your platform! We're thrilled about the possibility of partnering with you.</p>
            <p><strong>What we'll help you with:</strong></p>
            <ul>
              <li>Complete API documentation and code examples</li>
              <li>Technical integration support</li>
              <li>Custom implementation guidance</li>
              <li>Sandbox environment for testing</li>
            </ul>
            <p><strong>Expected timeline:</strong></p>
            <ul>
              <li>Initial response: Within 24 hours</li>
              <li>Technical consultation: Within 48 hours</li>
              <li>API access setup: Within 5 business days</li>
            </ul>
            <p>Check out our <a href="https://styleswap.co.za/api-docs">API documentation</a> to get started. Our technical team will reach out shortly.</p>
            <p>Best regards,<br/>The StyleSwap Technical Team</p>
          </div>
        </div>
      `,
    },
    support: {
      subject: 'Support Request - StyleSwap',
      html: `
        <div style="${containerStyle}">
          <div style="${headerStyle}">
            <h1 style="margin: 0; font-size: 28px;">StyleSwap</h1>
            <p style="margin: 10px 0 0 0; font-size: 14px;">Support Request Received</p>
          </div>
          <div style="${contentStyle}">
            <p>Hi ${customerName},</p>
            <p>Thank you for contacting StyleSwap support. We're here to help and will get back to you as soon as possible.</p>
            <p><strong>Support response times:</strong></p>
            <ul>
              <li>Critical issues: Within 2 hours</li>
              <li>Urgent issues: Within 4 hours</li>
              <li>General support: Within 24 hours</li>
            </ul>
            <p><strong>In the meantime:</strong></p>
            <ul>
              <li>Check our <a href="https://styleswap.co.za/api-docs">documentation</a> for common solutions</li>
              <li>Visit our help center for FAQs</li>
              <li>Reply to this email with any additional details</li>
            </ul>
            <p>Your support ticket reference: <strong>#${Date.now()}</strong></p>
            <p>Best regards,<br/>The StyleSwap Support Team</p>
          </div>
        </div>
      `,
    },
  };

  return templates[inquiryType];
};

export { generateEmailTemplate };
