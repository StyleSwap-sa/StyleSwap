import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle2, Clock, Lock, Zap } from 'lucide-react';

export default function ErrorCodesReference() {
  const errorCodes = [
    {
      code: 200,
      status: 'OK',
      icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
      description: 'Request successful. The try-on was generated successfully.',
      example: {
        response: `{
  "success": true,
  "statusCode": 200,
  "data": {
    "tryOnId": "tryon_1234567890",
    "imageUrl": "https://cdn.styleswap.com/tryons/...",
    "generatedAt": "2026-02-10T12:30:00Z",
    "processingTime": 2500
  },
  "rateLimit": {
    "limit": 100,
    "remaining": 87,
    "reset": 1644495600
  }
}`,
      },
      howToHandle: 'Process the response and display the generated try-on image to the user.',
    },
    {
      code: 400,
      status: 'Bad Request',
      icon: <AlertCircle className="w-5 h-5 text-yellow-600" />,
      description: 'The request contains invalid parameters or missing required fields.',
      causes: [
        'Missing required fields (apiKey, userImage, garmentImage)',
        'Invalid image format or size exceeds 5MB',
        'Invalid product ID format',
        'Malformed JSON in request body',
      ],
      example: {
        response: `{
  "success": false,
  "statusCode": 400,
  "error": "Missing required field: userImage",
  "details": {
    "field": "userImage",
    "message": "Image is required and must be base64 encoded"
  }
}`,
      },
      howToHandle: 'Validate all required fields before sending the request. Check image format and size.',
    },
    {
      code: 401,
      status: 'Unauthorized',
      icon: <Lock className="w-5 h-5 text-red-600" />,
      description: 'Authentication failed. API key is missing, invalid, or expired.',
      causes: [
        'Missing Authorization header',
        'Invalid API key format',
        'API key has been revoked',
        'API key belongs to a different account',
      ],
      example: {
        response: `{
  "success": false,
  "statusCode": 401,
  "error": "Invalid API key",
  "details": {
    "message": "The provided API key is not valid or has been revoked"
  }
}`,
      },
      howToHandle: 'Verify your API key is correct. Generate a new key from the Developer Portal if needed.',
    },
    {
      code: 403,
      status: 'Forbidden',
      icon: <Lock className="w-5 h-5 text-red-600" />,
      description: 'Access denied. Your account does not have permission for this operation.',
      causes: [
        'Account has insufficient credits',
        'Feature not available in your plan',
        'Account is suspended or inactive',
        'IP address is not whitelisted',
      ],
      example: {
        response: `{
  "success": false,
  "statusCode": 403,
  "error": "Insufficient credits",
  "details": {
    "creditsRequired": 1,
    "creditsAvailable": 0,
    "message": "Purchase credits to continue using the API"
  }
}`,
      },
      howToHandle: 'Purchase additional credits or upgrade your plan. Contact support if your account is suspended.',
    },
    {
      code: 429,
      status: 'Too Many Requests',
      icon: <Zap className="w-5 h-5 text-orange-600" />,
      description: 'Rate limit exceeded. You have made too many requests in a short time.',
      causes: [
        'Exceeded 100 requests per minute limit',
        'Concurrent requests exceed allowed limit',
        'Burst traffic detected',
      ],
      example: {
        response: `{
  "success": false,
  "statusCode": 429,
  "error": "Rate limit exceeded",
  "rateLimit": {
    "limit": 100,
    "remaining": 0,
    "reset": 1644495600,
    "retryAfter": 60
  }
}`,
      },
      howToHandle: 'Wait for the rate limit window to reset. Implement exponential backoff retry logic.',
    },
    {
      code: 500,
      status: 'Internal Server Error',
      icon: <AlertCircle className="w-5 h-5 text-red-600" />,
      description: 'Server error. An unexpected error occurred while processing your request.',
      causes: [
        'Server is temporarily unavailable',
        'Database connection failed',
        'Image processing service is down',
        'Unexpected error in try-on generation',
      ],
      example: {
        response: `{
  "success": false,
  "statusCode": 500,
  "error": "Internal server error",
  "details": {
    "requestId": "req_abc123def456",
    "message": "An unexpected error occurred. Please try again later."
  }
}`,
      },
      howToHandle: 'Retry the request after a delay. Contact support if the error persists.',
    },
    {
      code: 503,
      status: 'Service Unavailable',
      icon: <Clock className="w-5 h-5 text-red-600" />,
      description: 'Service temporarily unavailable. The API is under maintenance or experiencing issues.',
      causes: [
        'Scheduled maintenance in progress',
        'Service overloaded',
        'Database maintenance',
        'Temporary infrastructure issues',
      ],
      example: {
        response: `{
  "success": false,
  "statusCode": 503,
  "error": "Service unavailable",
  "details": {
    "retryAfter": 300,
    "message": "The service is temporarily unavailable. Please try again in 5 minutes."
  }
}`,
      },
      howToHandle: 'Wait for the specified retry period. Check status page for maintenance updates.',
    },
  ];

  const retryStrategies = [
    {
      name: 'Exponential Backoff',
      description: 'Increase wait time exponentially with each retry attempt.',
      code: `async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
      await new Promise(r => setTimeout(r, delay));
    }
  }
}`,
    },
    {
      name: 'Rate Limit Handling',
      description: 'Respect rate limit headers and implement queue-based request management.',
      code: `const response = await fetch('/api/trpc?batch=1', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify([...])
});

const remaining = parseInt(response.headers.get('X-RateLimit-Remaining'));
const reset = parseInt(response.headers.get('X-RateLimit-Reset'));

if (remaining === 0) {
  const waitTime = reset - Date.now();
  console.log(\`Rate limited. Wait \${waitTime}ms\`);
}`,
    },
    {
      name: 'Circuit Breaker',
      description: 'Prevent cascading failures by temporarily stopping requests after repeated errors.',
      code: `class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.failureCount = 0;
    this.threshold = threshold;
    this.timeout = timeout;
    this.state = 'CLOSED';
  }

  async call(fn) {
    if (this.state === 'OPEN') {
      throw new Error('Circuit breaker is OPEN');
    }
    try {
      const result = await fn();
      this.failureCount = 0;
      return result;
    } catch (error) {
      this.failureCount++;
      if (this.failureCount >= this.threshold) {
        this.state = 'OPEN';
        setTimeout(() => this.state = 'HALF_OPEN', this.timeout);
      }
      throw error;
    }
  }
}`,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/5">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Error Codes & Troubleshooting</h1>
          <p className="text-lg text-primary-foreground/90 max-w-2xl">
            Complete reference for API error codes, causes, and recovery strategies.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <Tabs defaultValue="errors" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="errors">HTTP Status Codes</TabsTrigger>
            <TabsTrigger value="retry">Retry Strategies</TabsTrigger>
          </TabsList>

          {/* Error Codes */}
          <TabsContent value="errors" className="space-y-6">
            {errorCodes.map((error) => (
              <Card key={error.code} className="overflow-hidden">
                <CardHeader className="bg-muted/50 border-b">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {error.icon}
                      <div>
                        <CardTitle className="text-lg">
                          {error.code} {error.status}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{error.description}</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  {error.causes && (
                    <div>
                      <h4 className="font-semibold mb-3">Common Causes:</h4>
                      <ul className="space-y-2">
                        {error.causes.map((cause, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <span className="text-primary mt-1">•</span>
                            <span>{cause}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold mb-3">Example Response:</h4>
                    <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                      <pre className="text-sm font-mono">{error.example.response}</pre>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">How to Handle:</h4>
                    <p className="text-sm text-muted-foreground">{error.howToHandle}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Retry Strategies */}
          <TabsContent value="retry" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Rate Limit Headers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Every API response includes rate limit information in the response headers:
                </p>
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="font-mono text-sm">
                    <div className="mb-2">
                      <span className="text-primary font-semibold">X-RateLimit-Limit:</span> 100
                    </div>
                    <div className="mb-2">
                      <span className="text-primary font-semibold">X-RateLimit-Remaining:</span> 87
                    </div>
                    <div className="mb-2">
                      <span className="text-primary font-semibold">X-RateLimit-Reset:</span> 1644495600
                    </div>
                    <div>
                      <span className="text-primary font-semibold">X-RateLimit-RetryAfter:</span> 60
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Use these headers to implement smart retry logic and avoid hitting rate limits.
                </p>
              </CardContent>
            </Card>

            {retryStrategies.map((strategy, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle>{strategy.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{strategy.description}</p>
                  <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm font-mono">{strategy.code}</pre>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* Best Practices */}
        <Card className="mt-12 bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle>Best Practices for Error Handling</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">✅ Do</h4>
                <ul className="space-y-2 text-sm">
                  <li>• Implement exponential backoff for retries</li>
                  <li>• Check rate limit headers before making requests</li>
                  <li>• Log error responses with request IDs</li>
                  <li>• Display user-friendly error messages</li>
                  <li>• Implement circuit breaker for cascading failures</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">❌ Don't</h4>
                <ul className="space-y-2 text-sm">
                  <li>• Retry immediately without delay</li>
                  <li>• Ignore rate limit headers</li>
                  <li>• Expose internal error details to users</li>
                  <li>• Retry on 401/403 errors indefinitely</li>
                  <li>• Make synchronous blocking calls</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
