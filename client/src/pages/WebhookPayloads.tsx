import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check } from 'lucide-react';

export default function WebhookPayloads() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const webhookEvents = [
    {
      name: 'tryon.generated',
      description: 'Triggered when a try-on image is successfully generated',
      payload: `{
  "id": "evt_1234567890",
  "object": "event",
  "type": "tryon.generated",
  "created": 1644495600,
  "data": {
    "tryOnId": "tryon_abc123def456",
    "customerId": "cust_123",
    "productId": "prod_456",
    "imageUrl": "https://cdn.styleswap.com/tryons/tryon_abc123def456.jpg",
    "generatedAt": "2026-02-10T12:30:00Z",
    "processingTime": 2500,
    "metadata": {
      "userAgent": "Mozilla/5.0...",
      "ipAddress": "192.168.1.1"
    }
  }
}`,
    },
    {
      name: 'tryon.failed',
      description: 'Triggered when try-on generation fails',
      payload: `{
  "id": "evt_1234567891",
  "object": "event",
  "type": "tryon.failed",
  "created": 1644495601,
  "data": {
    "tryOnId": "tryon_xyz789uvw012",
    "customerId": "cust_123",
    "productId": "prod_456",
    "error": "Invalid image format",
    "errorCode": "INVALID_IMAGE_FORMAT",
    "failedAt": "2026-02-10T12:30:05Z",
    "retryable": true,
    "metadata": {
      "userImage": "image_too_small.jpg",
      "garmentImage": "garment_corrupted.jpg"
    }
  }
}`,
    },
    {
      name: 'credits.purchased',
      description: 'Triggered when credits are successfully purchased',
      payload: `{
  "id": "evt_1234567892",
  "object": "event",
  "type": "credits.purchased",
  "created": 1644495602,
  "data": {
    "customerId": "cust_123",
    "transactionId": "txn_abc123def456",
    "amount": 750.00,
    "currency": "ZAR",
    "creditsAdded": 200,
    "creditsTotal": 450,
    "paymentMethod": "card",
    "cardLast4": "4242",
    "purchasedAt": "2026-02-10T12:30:10Z",
    "expiresAt": "2026-03-12T12:30:10Z",
    "metadata": {
      "plan": "standard",
      "discount": 0
    }
  }
}`,
    },
    {
      name: 'credits.used',
      description: 'Triggered when credits are consumed for a try-on',
      payload: `{
  "id": "evt_1234567893",
  "object": "event",
  "type": "credits.used",
  "created": 1644495603,
  "data": {
    "customerId": "cust_123",
    "tryOnId": "tryon_abc123def456",
    "creditsDeducted": 1,
    "creditsRemaining": 449,
    "usedAt": "2026-02-10T12:30:15Z",
    "metadata": {
      "productId": "prod_456",
      "productName": "Blue Dress"
    }
  }
}`,
    },
    {
      name: 'credits.expired',
      description: 'Triggered when purchased credits expire (30 days after purchase)',
      payload: `{
  "id": "evt_1234567894",
  "object": "event",
  "type": "credits.expired",
  "created": 1644495604,
  "data": {
    "customerId": "cust_123",
    "transactionId": "txn_abc123def456",
    "creditsExpired": 200,
    "creditsRemaining": 249,
    "expiredAt": "2026-03-12T12:30:10Z",
    "originalPurchaseDate": "2026-02-10T12:30:10Z",
    "metadata": {
      "plan": "standard"
    }
  }
}`,
    },
    {
      name: 'customer.created',
      description: 'Triggered when a new customer account is created',
      payload: `{
  "id": "evt_1234567895",
  "object": "event",
  "type": "customer.created",
  "created": 1644495605,
  "data": {
    "customerId": "cust_123",
    "email": "customer@example.com",
    "name": "John Doe",
    "createdAt": "2026-02-10T12:30:20Z",
    "plan": "free",
    "metadata": {
      "source": "web",
      "referralCode": "ref_abc123"
    }
  }
}`,
    },
    {
      name: 'payment.completed',
      description: 'Triggered when a payment is successfully processed',
      payload: `{
  "id": "evt_1234567896",
  "object": "event",
  "type": "payment.completed",
  "created": 1644495606,
  "data": {
    "customerId": "cust_123",
    "paymentId": "pay_abc123def456",
    "amount": 750.00,
    "currency": "ZAR",
    "status": "succeeded",
    "paymentMethod": "card",
    "cardBrand": "visa",
    "cardLast4": "4242",
    "completedAt": "2026-02-10T12:30:25Z",
    "metadata": {
      "invoiceId": "inv_123",
      "description": "200 try-ons credit purchase"
    }
  }
}`,
    },
  ];

  const verificationExample = `// Node.js example for verifying webhook signature
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hash = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return hash === signature;
}

// In your webhook handler:
app.post('/webhooks/styleswap', (req, res) => {
  const signature = req.headers['x-styleswap-signature'];
  const rawBody = req.rawBody; // Make sure to get raw body string
  
  if (!verifyWebhookSignature(rawBody, signature, process.env.WEBHOOK_SECRET)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  const event = req.body;
  
  // Process the event
  switch(event.type) {
    case 'tryon.generated':
      handleTryOnGenerated(event.data);
      break;
    case 'credits.purchased':
      handleCreditsPurchased(event.data);
      break;
    // ... handle other events
  }
  
  res.json({ received: true });
});`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/5">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Webhook Events & Payloads</h1>
          <p className="text-lg text-primary-foreground/90 max-w-2xl">
            Complete reference for all webhook events with payload examples and verification.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Webhook Configuration */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Webhook Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Setting Up Webhooks</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Navigate to your Developer Portal</li>
                <li>Go to the Webhooks section</li>
                <li>Enter your webhook endpoint URL (must be HTTPS)</li>
                <li>Select which events you want to receive</li>
                <li>Copy your webhook signing secret</li>
                <li>Save and test the webhook</li>
              </ol>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-semibold mb-2">Example Webhook URL:</p>
              <code className="text-sm">https://your-domain.com/webhooks/styleswap</code>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Webhook Headers</h4>
              <div className="bg-muted p-4 rounded-lg space-y-2 text-sm font-mono">
                <div><span className="text-primary">X-StyleSwap-Signature:</span> sha256=...</div>
                <div><span className="text-primary">X-StyleSwap-Event-ID:</span> evt_1234567890</div>
                <div><span className="text-primary">X-StyleSwap-Timestamp:</span> 1644495600</div>
                <div><span className="text-primary">Content-Type:</span> application/json</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Webhook Events */}
        <div className="space-y-6 mb-12">
          <h2 className="text-3xl font-bold">Webhook Events</h2>
          
          {webhookEvents.map((event, idx) => (
            <Card key={idx}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg font-mono">{event.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">{event.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Payload Example:</h4>
                    <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                      <pre className="text-sm font-mono">{event.payload}</pre>
                    </div>
                    <button
                      onClick={() => copyToClipboard(event.payload, `payload-${idx}`)}
                      className="mt-2 flex items-center gap-2 text-sm text-primary hover:text-primary/80"
                    >
                      {copiedCode === `payload-${idx}` ? (
                        <>
                          <Check className="w-4 h-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy Payload
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Verification */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Webhook Signature Verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Always verify webhook signatures to ensure the request comes from StyleSwap. The signature is computed using HMAC-SHA256.
            </p>
            
            <div className="bg-muted p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm font-mono">{verificationExample}</pre>
            </div>

            <button
              onClick={() => copyToClipboard(verificationExample, 'verification')}
              className="flex items-center gap-2 text-sm text-primary hover:text-primary/80"
            >
              {copiedCode === 'verification' ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Code
                </>
              )}
            </button>
          </CardContent>
        </Card>

        {/* Best Practices */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle>Webhook Best Practices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">✅ Do</h4>
                <ul className="space-y-2 text-sm">
                  <li>• Verify webhook signatures</li>
                  <li>• Respond with 200 within 30 seconds</li>
                  <li>• Process webhooks asynchronously</li>
                  <li>• Log all webhook events</li>
                  <li>• Implement idempotency (handle duplicate events)</li>
                  <li>• Use HTTPS endpoints</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3">❌ Don't</h4>
                <ul className="space-y-2 text-sm">
                  <li>• Skip signature verification</li>
                  <li>• Perform long operations in webhook handler</li>
                  <li>• Use HTTP endpoints</li>
                  <li>• Ignore duplicate events</li>
                  <li>• Store sensitive data from webhooks</li>
                  <li>• Retry failed webhooks indefinitely</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
