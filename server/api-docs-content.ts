/**
 * API Documentation Content
 * Centralized documentation for StyleSwap API
 */

export interface APIEndpoint {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  title: string;
  description: string;
  authentication: string;
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
    example?: string;
  }>;
  requestBody?: {
    description: string;
    example: Record<string, any>;
  };
  response: {
    description: string;
    example: Record<string, any>;
  };
  errors?: Array<{
    code: number;
    message: string;
    description: string;
  }>;
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
}

export const API_ENDPOINTS: APIEndpoint[] = [
  {
    method: "POST",
    path: "/api/trpc/tryOn.create",
    title: "Create Virtual Try-On",
    description: "Generate a virtual try-on image for a customer with a garment",
    authentication: "API Key (Bearer token)",
    parameters: [
      {
        name: "customerImageUrl",
        type: "string",
        required: true,
        description: "URL of the customer's full-body photo",
        example: "https://example.com/customer.jpg",
      },
      {
        name: "garmentImageUrl",
        type: "string",
        required: true,
        description: "URL of the garment image",
        example: "https://example.com/dress.jpg",
      },
      {
        name: "garmentType",
        type: "string",
        required: true,
        description: "Type of garment (dress, shirt, pants, etc.)",
        example: "dress",
      },
      {
        name: "size",
        type: "string",
        required: false,
        description: "Customer's clothing size",
        example: "M",
      },
    ],
    requestBody: {
      description: "Try-on request payload",
      example: {
        customerImageUrl: "https://example.com/customer.jpg",
        garmentImageUrl: "https://example.com/dress.jpg",
        garmentType: "dress",
        size: "M",
      },
    },
    response: {
      description: "Successfully generated try-on image",
      example: {
        id: "tryon_123abc",
        status: "completed",
        imageUrl: "https://styleswap.s3.amazonaws.com/tryons/tryon_123abc.jpg",
        confidence: 0.95,
        processingTime: 8500,
      },
    },
    errors: [
      {
        code: 400,
        message: "Invalid request",
        description: "Missing required parameters or invalid format",
      },
      {
        code: 401,
        message: "Unauthorized",
        description: "Invalid or missing API key",
      },
      {
        code: 429,
        message: "Rate limit exceeded",
        description: "Too many requests. Please wait before retrying.",
      },
      {
        code: 500,
        message: "Server error",
        description: "Internal server error during try-on generation",
      },
    ],
    rateLimit: {
      requestsPerMinute: 60,
      requestsPerHour: 3000,
      requestsPerDay: 50000,
    },
  },
  {
    method: "GET",
    path: "/api/trpc/tryOn.get",
    title: "Get Try-On Result",
    description: "Retrieve a previously generated try-on image",
    authentication: "API Key (Bearer token)",
    parameters: [
      {
        name: "tryonId",
        type: "string",
        required: true,
        description: "ID of the try-on to retrieve",
        example: "tryon_123abc",
      },
    ],
    response: {
      description: "Try-on details",
      example: {
        id: "tryon_123abc",
        status: "completed",
        imageUrl: "https://styleswap.s3.amazonaws.com/tryons/tryon_123abc.jpg",
        confidence: 0.95,
        processingTime: 8500,
        createdAt: "2026-03-12T14:30:00Z",
      },
    },
    errors: [
      {
        code: 404,
        message: "Not found",
        description: "Try-on with specified ID not found",
      },
      {
        code: 401,
        message: "Unauthorized",
        description: "Invalid or missing API key",
      },
    ],
  },
  {
    method: "GET",
    path: "/api/trpc/credits.getBalance",
    title: "Get Credit Balance",
    description: "Retrieve the current credit balance for your app",
    authentication: "API Key (Bearer token)",
    response: {
      description: "Current credit balance",
      example: {
        balance: 5000,
        currency: "credits",
        lastUpdated: "2026-03-12T14:30:00Z",
      },
    },
    errors: [
      {
        code: 401,
        message: "Unauthorized",
        description: "Invalid or missing API key",
      },
    ],
  },
  {
    method: "POST",
    path: "/api/trpc/webhooks.create",
    title: "Create Webhook",
    description: "Register a webhook endpoint to receive real-time events",
    authentication: "API Key (Bearer token)",
    requestBody: {
      description: "Webhook configuration",
      example: {
        url: "https://your-domain.com/webhooks/styleswap",
        events: ["tryon.completed", "credits.updated"],
      },
    },
    response: {
      description: "Webhook created successfully",
      example: {
        id: "webhook_123",
        url: "https://your-domain.com/webhooks/styleswap",
        events: ["tryon.completed", "credits.updated"],
        isActive: true,
        createdAt: "2026-03-12T14:30:00Z",
      },
    },
    errors: [
      {
        code: 400,
        message: "Invalid URL",
        description: "Webhook URL must be HTTPS",
      },
      {
        code: 401,
        message: "Unauthorized",
        description: "Invalid or missing API key",
      },
    ],
  },
];

export const API_GUIDES = {
  authentication: {
    title: "Authentication",
    content: `
# Authentication

StyleSwap API uses API key-based authentication. Include your API key in the Authorization header of every request:

\`\`\`
Authorization: Bearer sk_live_your_api_key_here
\`\`\`

## Getting Your API Key

1. Log in to your StyleSwap Developer Dashboard
2. Navigate to the "Credentials" tab
3. Copy your API Key (starts with \`sk_\`)
4. Keep your API Secret secure - never share it publicly

## API Key Formats

- **Live Mode**: \`sk_live_...\`
- **Test Mode**: \`sk_test_...\`

## Security Best Practices

- Store API keys in environment variables, never in code
- Rotate your API key regularly
- Use separate keys for development and production
- Regenerate your secret if compromised
    `,
  },
  rateLimit: {
    title: "Rate Limiting",
    content: `
# Rate Limiting

StyleSwap API implements rate limiting to ensure fair usage and platform stability.

## Rate Limits by Plan

| Plan | Per Minute | Per Hour | Per Day |
|------|-----------|----------|---------|
| Starter | 60 | 3,000 | 50,000 |
| Professional | 120 | 6,000 | 100,000 |
| Enterprise | Custom | Custom | Custom |

## Rate Limit Headers

Every API response includes rate limit information in the headers:

\`\`\`
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1678710600
\`\`\`

## Handling Rate Limits

When you exceed the rate limit, you'll receive a 429 (Too Many Requests) response. The \`Retry-After\` header indicates how many seconds to wait before retrying:

\`\`\`
HTTP/1.1 429 Too Many Requests
Retry-After: 60
\`\`\`

Implement exponential backoff when retrying:

\`\`\`javascript
const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s, 8s...
setTimeout(() => retry(), delay);
\`\`\`
    `,
  },
  errors: {
    title: "Error Handling",
    content: `
# Error Handling

StyleSwap API uses standard HTTP status codes to indicate success or failure.

## Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request succeeded |
| 400 | Bad Request | Invalid parameters or malformed request |
| 401 | Unauthorized | Invalid or missing API key |
| 403 | Forbidden | Access denied |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Internal server error |

## Error Response Format

\`\`\`json
{
  "success": false,
  "error": {
    "code": "invalid_request",
    "message": "Missing required parameter: garmentImageUrl",
    "details": {
      "parameter": "garmentImageUrl"
    }
  }
}
\`\`\`

## Common Errors

### 401 Unauthorized
- Missing API key
- Invalid API key format
- Expired API key

### 429 Rate Limited
- Too many requests in the time window
- Check \`Retry-After\` header for wait time

### 500 Server Error
- Try again after a few seconds
- Contact support if persists
    `,
  },
  webhooks: {
    title: "Webhooks",
    content: `
# Webhooks

Webhooks allow you to receive real-time notifications about events in your StyleSwap integration.

## Available Events

- \`app.registered\` - Your app was registered
- \`tryon.completed\` - A try-on was completed successfully
- \`tryon.failed\` - A try-on failed
- \`credits.updated\` - Your credit balance changed
- \`credits.low\` - Your credits are running low

## Webhook Payload

Each webhook request includes:

\`\`\`json
{
  "id": 12345,
  "type": "tryon.completed",
  "data": {
    "tryonId": "tryon_123abc",
    "status": "completed",
    "imageUrl": "https://...",
    "confidence": 0.95
  },
  "timestamp": "2026-03-12T14:30:00Z"
}
\`\`\`

## Signature Verification

Every webhook request includes an \`X-Webhook-Signature\` header containing an HMAC-SHA256 signature:

\`\`\`javascript
const crypto = require('crypto');
const signature = req.headers['x-webhook-signature'];
const secret = 'your-webhook-secret';

const hash = crypto
  .createHmac('sha256', secret)
  .update(JSON.stringify(req.body))
  .digest('hex');

if (hash !== signature) {
  throw new Error('Invalid signature');
}
\`\`\`

## Retry Policy

Failed webhook deliveries are automatically retried with exponential backoff:
- Max retries: 5
- Initial delay: 60 seconds
- Backoff multiplier: 2x

## Testing Webhooks

Use the Developer Dashboard to send test events to your webhook endpoint.
    `,
  },
  pricing: {
    title: "Pricing & Credits",
    content: `
# Pricing & Credits

StyleSwap uses a credit-based pricing model. Each API call consumes credits from your account.

## Credit Costs

| Operation | Credits |
|-----------|---------|
| Try-On Generation | 10 credits |
| Batch Try-On (10 images) | 90 credits |
| High-Resolution Output | +5 credits |

## Purchasing Credits

Visit your Developer Dashboard to purchase additional credits. Credits are non-refundable once purchased.

## Plans

### Starter
- 1,000 credits/month
- \$29/month
- 60 requests/minute

### Professional
- 5,000 credits/month
- \$99/month
- 120 requests/minute

### Enterprise
- Custom credits
- Custom pricing
- Custom rate limits

Contact sales@styleswap.co.za for enterprise pricing.
    `,
  },
};

export const CODE_EXAMPLES = {
  python: {
    title: "Python",
    language: "python",
    code: `import requests
import json

API_KEY = "sk_live_your_api_key_here"
BASE_URL = "https://api.styleswap.co.za"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# Create a try-on
payload = {
    "customerImageUrl": "https://example.com/customer.jpg",
    "garmentImageUrl": "https://example.com/dress.jpg",
    "garmentType": "dress",
    "size": "M"
}

response = requests.post(
    f"{BASE_URL}/api/trpc/tryOn.create",
    json=payload,
    headers=headers
)

result = response.json()
print(f"Try-on ID: {result['id']}")
print(f"Image URL: {result['imageUrl']}")`,
  },
  javascript: {
    title: "JavaScript",
    language: "javascript",
    code: `const API_KEY = "sk_live_your_api_key_here";
const BASE_URL = "https://api.styleswap.co.za";

async function createTryOn(customerImageUrl, garmentImageUrl) {
  const response = await fetch(\`\${BASE_URL}/api/trpc/tryOn.create\`, {
    method: "POST",
    headers: {
      "Authorization": \`Bearer \${API_KEY}\`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      customerImageUrl,
      garmentImageUrl,
      garmentType: "dress",
      size: "M"
    })
  });

  const result = await response.json();
  console.log(\`Try-on ID: \${result.id}\`);
  console.log(\`Image URL: \${result.imageUrl}\`);
  return result;
}

// Usage
createTryOn(
  "https://example.com/customer.jpg",
  "https://example.com/dress.jpg"
);`,
  },
  curl: {
    title: "cURL",
    language: "bash",
    code: `curl -X POST https://api.styleswap.co.za/api/trpc/tryOn.create \\
  -H "Authorization: Bearer sk_live_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "customerImageUrl": "https://example.com/customer.jpg",
    "garmentImageUrl": "https://example.com/dress.jpg",
    "garmentType": "dress",
    "size": "M"
  }'`,
  },
};
