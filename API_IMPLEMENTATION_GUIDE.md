# StyleSwap API Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing the StyleSwap API key management dashboard, webhook system, and integration examples for enterprise retail partners like Mr Price.

---

## Phase 1: API Key Management Dashboard

### 1.1 Database Schema

Create the following tables in your database:

```sql
-- API Keys Table
CREATE TABLE apiKeys (
  id INT AUTO_INCREMENT PRIMARY KEY,
  boutiqueId INT NOT NULL REFERENCES boutiques(id),
  name VARCHAR(255) NOT NULL,
  keyHash VARCHAR(255) NOT NULL UNIQUE,
  keyPreview VARCHAR(20) NOT NULL,
  description TEXT,
  permissions JSON DEFAULT JSON_ARRAY('products:read', 'products:write', 'tryons:read', 'tryons:write', 'customers:read', 'analytics:read'),
  isActive INT DEFAULT 1,
  lastUsedAt TIMESTAMP NULL,
  rateLimit INT DEFAULT 1000,
  usageCount INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  expiresAt TIMESTAMP NULL,
  INDEX idx_api_keys_boutique (boutiqueId),
  INDEX idx_api_keys_active (isActive),
  INDEX idx_api_keys_created (createdAt)
);

-- API Key Usage Tracking
CREATE TABLE apiKeyUsage (
  id INT AUTO_INCREMENT PRIMARY KEY,
  apiKeyId INT NOT NULL REFERENCES apiKeys(id),
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  statusCode INT NOT NULL,
  responseTime INT NOT NULL,
  ipAddress VARCHAR(45),
  userAgent TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_api_key_usage_key (apiKeyId),
  INDEX idx_api_key_usage_created (createdAt),
  INDEX idx_api_key_usage_endpoint (endpoint)
);
```

### 1.2 API Key Management Endpoints

Add these tRPC procedures to your API router:

```typescript
// server/routers/apiManagement.ts
import { router, protectedProcedure } from "@/server/_core/trpc";
import { z } from "zod";
import crypto from "crypto";

export const apiManagementRouter = router({
  // Generate new API key
  generateApiKey: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      description: z.string().optional(),
      permissions: z.array(z.string()).default(['products:read', 'products:write', 'tryons:read', 'tryons:write', 'customers:read', 'analytics:read']),
      expiresAt: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Generate random API key
      const apiKey = `sk_${crypto.randomBytes(32).toString('hex')}`;
      const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
      const keyPreview = apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4);

      // Save to database
      const result = await db.insert(apiKeys).values({
        boutiqueId: ctx.user.id,
        name: input.name,
        keyHash,
        keyPreview,
        description: input.description,
        permissions: input.permissions,
        expiresAt: input.expiresAt,
      });

      return {
        id: result.insertId,
        apiKey, // Only return once
        keyPreview,
        name: input.name,
        createdAt: new Date(),
      };
    }),

  // List API keys
  listApiKeys: protectedProcedure.query(async ({ ctx }) => {
    return await db.select().from(apiKeys)
      .where(eq(apiKeys.boutiqueId, ctx.user.id))
      .orderBy(desc(apiKeys.createdAt));
  }),

  // Revoke API key
  revokeApiKey: protectedProcedure
    .input(z.object({ keyId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.update(apiKeys)
        .set({ isActive: 0 })
        .where(and(
          eq(apiKeys.id, input.keyId),
          eq(apiKeys.boutiqueId, ctx.user.id)
        ));
      return { success: true };
    }),

  // Get API key usage analytics
  getApiKeyUsage: protectedProcedure
    .input(z.object({
      keyId: z.number(),
      days: z.number().default(30),
    }))
    .query(async ({ ctx, input }) => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      return await db.select({
        date: sql`DATE(createdAt)`,
        count: sql`COUNT(*)`,
        avgResponseTime: sql`AVG(responseTime)`,
      })
        .from(apiKeyUsage)
        .where(and(
          eq(apiKeyUsage.apiKeyId, input.keyId),
          gte(apiKeyUsage.createdAt, startDate)
        ))
        .groupBy(sql`DATE(createdAt)`);
    }),
});
```

### 1.3 API Key Management UI

Create a dashboard page for managing API keys:

```typescript
// client/src/pages/ApiKeyManagement.tsx
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Trash2, Plus } from 'lucide-react';

export default function ApiKeyManagement() {
  const [showNewKeyForm, setShowNewKeyForm] = useState(false);
  const { data: apiKeys } = trpc.apiManagement.listApiKeys.useQuery();
  const generateKeyMutation = trpc.apiManagement.generateApiKey.useMutation();
  const revokeKeyMutation = trpc.apiManagement.revokeApiKey.useMutation();

  const handleGenerateKey = async (name: string) => {
    const result = await generateKeyMutation.mutateAsync({ name });
    // Show the key to user (only shown once)
    alert(`Your API Key: ${result.apiKey}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">API Keys</h1>
        <Button onClick={() => setShowNewKeyForm(true)}>
          <Plus className="mr-2 w-4 h-4" /> Generate New Key
        </Button>
      </div>

      {/* API Keys List */}
      <div className="space-y-4">
        {apiKeys?.map((key) => (
          <Card key={key.id}>
            <CardHeader className="flex flex-row justify-between items-center">
              <CardTitle>{key.name}</CardTitle>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => revokeKeyMutation.mutate({ keyId: key.id })}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <code className="bg-gray-100 px-3 py-1 rounded">{key.keyPreview}</code>
                  <Button size="sm" variant="ghost">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-600">
                  Created: {new Date(key.createdAt).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600">
                  Last used: {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never'}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

---

## Phase 2: Webhook System

### 2.1 Webhook Management Endpoints

```typescript
// server/routers/webhooks.ts
import { router, protectedProcedure } from "@/server/_core/trpc";
import { z } from "zod";
import crypto from "crypto";

export const webhooksRouter = router({
  // Register webhook
  registerWebhook: protectedProcedure
    .input(z.object({
      name: z.string(),
      url: z.string().url(),
      events: z.array(z.string()),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const secret = crypto.randomBytes(32).toString('hex');
      
      const result = await db.insert(webhooks).values({
        boutiqueId: ctx.user.id,
        name: input.name,
        url: input.url,
        events: input.events,
        secret,
        description: input.description,
      });

      return {
        id: result.insertId,
        secret, // Only shown once
        ...input,
      };
    }),

  // List webhooks
  listWebhooks: protectedProcedure.query(async ({ ctx }) => {
    return await db.select().from(webhooks)
      .where(eq(webhooks.boutiqueId, ctx.user.id));
  }),

  // Delete webhook
  deleteWebhook: protectedProcedure
    .input(z.object({ webhookId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.delete(webhooks)
        .where(and(
          eq(webhooks.id, input.webhookId),
          eq(webhooks.boutiqueId, ctx.user.id)
        ));
      return { success: true };
    }),

  // Get webhook delivery logs
  getWebhookLogs: protectedProcedure
    .input(z.object({
      webhookId: z.number(),
      limit: z.number().default(50),
    }))
    .query(async ({ ctx, input }) => {
      return await db.select()
        .from(webhookDeliveryLog)
        .innerJoin(webhookEvents, eq(webhookDeliveryLog.webhookEventId, webhookEvents.id))
        .where(eq(webhookEvents.webhookId, input.webhookId))
        .orderBy(desc(webhookDeliveryLog.createdAt))
        .limit(input.limit);
    }),
});
```

### 2.2 Webhook Event Emission

Add webhook event emission to your try-on generation endpoint:

```typescript
// When try-on is generated
async function emitWebhookEvent(
  boutiqueId: number,
  eventType: string,
  payload: any
) {
  // Get all active webhooks for this boutique
  const webhooks = await db.select()
    .from(webhooks)
    .where(and(
      eq(webhooks.boutiqueId, boutiqueId),
      eq(webhooks.isActive, 1)
    ));

  for (const webhook of webhooks) {
    if (!webhook.events.includes(eventType)) continue;

    // Create webhook event record
    const event = await db.insert(webhookEvents).values({
      webhookId: webhook.id,
      eventType,
      payload,
      deliveryStatus: 'pending',
      nextRetryAt: new Date(),
    });

    // Queue for delivery (use a job queue like Bull or RabbitMQ)
    await deliverWebhookEvent(event.insertId, webhook);
  }
}

// Webhook delivery with retry logic
async function deliverWebhookEvent(eventId: number, webhook: Webhook) {
  const event = await db.select().from(webhookEvents)
    .where(eq(webhookEvents.id, eventId));

  const signature = crypto
    .createHmac('sha256', webhook.secret)
    .update(JSON.stringify(event.payload))
    .digest('hex');

  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': event.eventType,
      },
      body: JSON.stringify(event.payload),
    });

    if (response.ok) {
      await db.update(webhookEvents)
        .set({
          deliveryStatus: 'delivered',
          deliveredAt: new Date(),
        })
        .where(eq(webhookEvents.id, eventId));
    } else {
      // Retry logic
      await retryWebhookEvent(eventId, webhook);
    }
  } catch (error) {
    await retryWebhookEvent(eventId, webhook);
  }
}

async function retryWebhookEvent(eventId: number, webhook: Webhook) {
  const event = await db.select().from(webhookEvents)
    .where(eq(webhookEvents.id, eventId));

  if (event.retryCount < webhook.retryPolicy.maxRetries) {
    const nextRetryDelay = Math.pow(
      webhook.retryPolicy.backoffMultiplier,
      event.retryCount
    ) * 60000; // exponential backoff in minutes

    const nextRetryAt = new Date(Date.now() + nextRetryDelay);

    await db.update(webhookEvents)
      .set({
        retryCount: event.retryCount + 1,
        nextRetryAt,
        deliveryStatus: 'retrying',
      })
      .where(eq(webhookEvents.id, eventId));
  } else {
    await db.update(webhookEvents)
      .set({
        deliveryStatus: 'failed',
      })
      .where(eq(webhookEvents.id, eventId));
  }
}
```

---

## Phase 3: Integration Examples

### 3.1 Mr Price Integration Example

```typescript
// examples/mr-price-integration.ts
import { StyleSwapAPI } from '../sdks/styleswap-node-sdk';

const styleswap = new StyleSwapAPI({
  apiKey: process.env.STYLESWAP_API_KEY,
});

// 1. Upload Mr Price product catalog
async function syncProductCatalog() {
  const mrPriceProducts = await fetchMrPriceProducts();
  
  for (const product of mrPriceProducts) {
    await styleswap.products.create({
      externalId: product.id,
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl,
      category: product.category,
      price: product.price,
    });
  }
}

// 2. Handle customer try-on request
async function handleTryOn(customerId: string, productId: string, photoUrl: string) {
  const tryon = await styleswap.tryons.generate({
    customerId,
    productId,
    photoUrl,
    type: 'top', // or 'bottom'
  });

  // Wait for generation
  let result = tryon;
  while (result.status === 'processing') {
    await new Promise(resolve => setTimeout(resolve, 2000));
    result = await styleswap.tryons.get(tryon.id);
  }

  if (result.status === 'completed') {
    // Save result to Mr Price database
    await saveTryOnResult({
      customerId,
      productId,
      resultUrl: result.imageUrl,
      createdAt: new Date(),
    });
  }
}

// 3. Set up webhook for real-time notifications
async function setupWebhook() {
  const webhook = await styleswap.webhooks.register({
    url: 'https://mrprice.com/api/styleswap/webhook',
    events: ['tryon.generated', 'tryon.failed'],
    name: 'Mr Price Try-On Notifications',
  });

  console.log('Webhook registered:', webhook.id);
}

// 4. Webhook handler
app.post('/api/styleswap/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const event = req.body;

  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.STYLESWAP_WEBHOOK_SECRET)
    .update(JSON.stringify(event))
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Handle event
  if (event.type === 'tryon.generated') {
    handleTryOnGenerated(event.data);
  } else if (event.type === 'tryon.failed') {
    handleTryOnFailed(event.data);
  }

  res.json({ received: true });
});
```

### 3.2 Python Integration Example

```python
# examples/mr_price_integration.py
from styleswap_sdk import StyleSwapAPI
import json
import time

styleswap = StyleSwapAPI(api_key='your_api_key')

# 1. Bulk upload products
def sync_product_catalog():
    products = fetch_mr_price_products()
    
    for product in products:
        styleswap.products.create(
            external_id=product['id'],
            name=product['name'],
            description=product['description'],
            image_url=product['image_url'],
            category=product['category'],
            price=product['price']
        )

# 2. Generate try-on
def handle_try_on(customer_id, product_id, photo_url):
    tryon = styleswap.tryons.generate(
        customer_id=customer_id,
        product_id=product_id,
        photo_url=photo_url,
        type='top'
    )
    
    # Poll for completion
    while True:
        result = styleswap.tryons.get(tryon['id'])
        if result['status'] != 'processing':
            break
        time.sleep(2)
    
    if result['status'] == 'completed':
        save_try_on_result(
            customer_id=customer_id,
            product_id=product_id,
            result_url=result['image_url']
        )

# 3. Get analytics
def get_analytics():
    analytics = styleswap.analytics.get(
        start_date='2026-01-01',
        end_date='2026-02-09',
        metrics=['total_tryons', 'conversion_rate', 'avg_response_time']
    )
    return analytics
```

---

## Webhook Events Reference

### Supported Events

- `tryon.generated` - Try-on successfully generated
- `tryon.failed` - Try-on generation failed
- `customer.created` - New customer registered
- `payment.completed` - Payment received
- `product.created` - New product added
- `product.updated` - Product information updated

### Event Payload Example

```json
{
  "id": "evt_1234567890",
  "type": "tryon.generated",
  "timestamp": "2026-02-09T15:30:00Z",
  "data": {
    "tryonId": "tryon_abc123",
    "customerId": "cust_xyz789",
    "productId": "prod_def456",
    "imageUrl": "https://cdn.styleswap.com/tryons/abc123.jpg",
    "status": "completed",
    "processingTime": 12500
  }
}
```

---

## Rate Limiting

The API enforces rate limiting per API key:

- Default: 1000 requests per minute
- Can be customized per key
- Returns `429 Too Many Requests` when exceeded
- Includes `X-RateLimit-*` headers in responses

---

## Next Steps

1. **Implement the database tables** using the SQL provided
2. **Add the API endpoints** to your tRPC router
3. **Create the API key management UI** for boutique partners
4. **Set up webhook delivery system** with retry logic
5. **Test with integration examples** (Mr Price, etc.)
6. **Monitor API usage** via the analytics dashboard

---

## Support

For questions or issues with the API implementation, contact: api-support@styleswap.com
