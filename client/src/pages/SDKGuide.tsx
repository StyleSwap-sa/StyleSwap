import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check } from 'lucide-react';

export default function SDKGuide() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const sdks = [
    {
      name: 'Node.js',
      language: 'javascript',
      installation: 'npm install @styleswap/sdk',
      examples: [
        {
          title: 'Initialize Client',
          code: `const { StyleSwapAPI } = require('@styleswap/sdk');

const styleswap = new StyleSwapAPI({
  apiKey: process.env.STYLESWAP_API_KEY,
  baseURL: 'https://api.styleswap.com'
});`,
        },
        {
          title: 'Generate Try-On',
          code: `const tryon = await styleswap.tryons.generate({
  customerId: 'cust_123',
  productId: 'prod_456',
  productName: 'Blue Dress',
  userImageUrl: 'https://example.com/user.jpg',
  garmentImageUrl: 'https://example.com/garment.jpg'
});

console.log('Try-on ID:', tryon.id);
console.log('Image URL:', tryon.imageUrl);`,
        },
        {
          title: 'Get Usage Statistics',
          code: `const stats = await styleswap.usage.getStats({
  period: '24h' // 1h, 24h, 7d, 30d
});

console.log('Total requests:', stats.totalRequests);
console.log('Credits used:', stats.quotaUsed);
console.log('Credits remaining:', stats.quotaLimit - stats.quotaUsed);`,
        },
        {
          title: 'Purchase Credits',
          code: `const purchase = await styleswap.billing.initiatePurchase({
  package: 'standard', // 100, 200, 500, 1000, 5000, 20000
  customerId: 'cust_123'
});

// Redirect user to checkout
window.location.href = purchase.checkoutUrl;`,
        },
      ],
    },
    {
      name: 'Python',
      language: 'python',
      installation: 'pip install styleswap-sdk',
      examples: [
        {
          title: 'Initialize Client',
          code: `from styleswap import StyleSwapAPI

styleswap = StyleSwapAPI(
    api_key=os.getenv('STYLESWAP_API_KEY'),
    base_url='https://api.styleswap.com'
)`,
        },
        {
          title: 'Generate Try-On',
          code: `tryon = styleswap.tryons.generate(
    customer_id='cust_123',
    product_id='prod_456',
    product_name='Blue Dress',
    user_image_url='https://example.com/user.jpg',
    garment_image_url='https://example.com/garment.jpg'
)

print(f'Try-on ID: {tryon.id}')
print(f'Image URL: {tryon.image_url}')`,
        },
        {
          title: 'Get Usage Statistics',
          code: `stats = styleswap.usage.get_stats(period='24h')

print(f'Total requests: {stats.total_requests}')
print(f'Credits used: {stats.quota_used}')
print(f'Credits remaining: {stats.quota_limit - stats.quota_used}')`,
        },
        {
          title: 'Purchase Credits',
          code: `purchase = styleswap.billing.initiate_purchase(
    package='standard',
    customer_id='cust_123'
)

# Redirect user to checkout
return redirect(purchase.checkout_url)`,
        },
      ],
    },
    {
      name: 'cURL',
      language: 'bash',
      installation: 'No installation required',
      examples: [
        {
          title: 'Generate Try-On',
          code: `curl -X POST https://api.styleswap.com/api/tryons/generate \\
  -H "Authorization: Bearer sk_live_xxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "customerId": "cust_123",
    "productId": "prod_456",
    "productName": "Blue Dress",
    "userImageUrl": "https://example.com/user.jpg",
    "garmentImageUrl": "https://example.com/garment.jpg"
  }'`,
        },
        {
          title: 'Get Usage Statistics',
          code: `curl -X GET "https://api.styleswap.com/api/usage/stats?period=24h" \\
  -H "Authorization: Bearer sk_live_xxxxx" \\
  -H "Content-Type: application/json"`,
        },
        {
          title: 'List Try-Ons',
          code: `curl -X GET "https://api.styleswap.com/api/tryons?limit=50&offset=0" \\
  -H "Authorization: Bearer sk_live_xxxxx" \\
  -H "Content-Type: application/json"`,
        },
      ],
    },
  ];

  const commonPatterns = [
    {
      title: 'Error Handling',
      code: `try {
  const tryon = await styleswap.tryons.generate({
    customerId: 'cust_123',
    productId: 'prod_456',
    userImageUrl: 'https://example.com/user.jpg',
    garmentImageUrl: 'https://example.com/garment.jpg'
  });
  console.log('Success:', tryon);
} catch (error) {
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    console.log('Rate limited. Retry after:', error.retryAfter);
  } else if (error.code === 'INSUFFICIENT_CREDITS') {
    console.log('Need to purchase credits');
  } else {
    console.error('Error:', error.message);
  }
}`,
    },
    {
      title: 'Polling for Async Results',
      code: `async function waitForTryOn(tryOnId, maxWait = 30000) {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWait) {
    const tryon = await styleswap.tryons.get(tryOnId);
    
    if (tryon.status === 'completed') {
      return tryon;
    }
    
    if (tryon.status === 'failed') {
      throw new Error(tryon.error);
    }
    
    // Wait 2 seconds before retrying
    await new Promise(r => setTimeout(r, 2000));
  }
  
  throw new Error('Try-on generation timeout');
}`,
    },
    {
      title: 'Batch Processing',
      code: `async function generateMultipleTryOns(items) {
  const results = [];
  
  for (const item of items) {
    try {
      const tryon = await styleswap.tryons.generate({
        customerId: item.customerId,
        productId: item.productId,
        userImageUrl: item.userImageUrl,
        garmentImageUrl: item.garmentImageUrl
      });
      results.push({ success: true, data: tryon });
    } catch (error) {
      results.push({ success: false, error: error.message });
    }
    
    // Add delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 100));
  }
  
  return results;
}`,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/5">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">SDK Installation & Integration</h1>
          <p className="text-lg text-primary-foreground/90 max-w-2xl">
            Official SDKs for Node.js, Python, and more. Get started in minutes.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* SDK Tabs */}
        <Tabs defaultValue="nodejs" className="space-y-6 mb-12">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="nodejs">Node.js</TabsTrigger>
            <TabsTrigger value="python">Python</TabsTrigger>
            <TabsTrigger value="curl">cURL</TabsTrigger>
          </TabsList>

          {sdks.map((sdk) => (
            <TabsContent key={sdk.name} value={sdk.name.toLowerCase().replace('.', '')}>
              <Card>
                <CardHeader>
                  <CardTitle>{sdk.name} SDK</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Installation */}
                  <div>
                    <h4 className="font-semibold mb-2">Installation</h4>
                    <div className="bg-muted p-4 rounded-lg">
                      <code className="text-sm font-mono">{sdk.installation}</code>
                    </div>
                  </div>

                  {/* Examples */}
                  <div>
                    <h4 className="font-semibold mb-4">Examples</h4>
                    <div className="space-y-6">
                      {sdk.examples.map((example, idx) => (
                        <div key={idx}>
                          <h5 className="font-medium mb-2 text-sm">{example.title}</h5>
                          <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                            <pre className="text-sm font-mono">{example.code}</pre>
                          </div>
                          <button
                            onClick={() => copyToClipboard(example.code, `${sdk.name}-${idx}`)}
                            className="mt-2 flex items-center gap-2 text-sm text-primary hover:text-primary/80"
                          >
                            {copiedCode === `${sdk.name}-${idx}` ? (
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
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Common Patterns */}
        <div className="space-y-6 mb-12">
          <h2 className="text-3xl font-bold">Common Patterns</h2>

          {commonPatterns.map((pattern, idx) => (
            <Card key={idx}>
              <CardHeader>
                <CardTitle>{pattern.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg overflow-x-auto mb-4">
                  <pre className="text-sm font-mono">{pattern.code}</pre>
                </div>
                <button
                  onClick={() => copyToClipboard(pattern.code, `pattern-${idx}`)}
                  className="flex items-center gap-2 text-sm text-primary hover:text-primary/80"
                >
                  {copiedCode === `pattern-${idx}` ? (
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
          ))}
        </div>

        {/* Environment Variables */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Environment Variables</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Store your API credentials securely using environment variables:
            </p>
            <div className="bg-muted p-4 rounded-lg space-y-2 font-mono text-sm">
              <div><span className="text-primary">STYLESWAP_API_KEY=</span>sk_live_xxxxx</div>
              <div><span className="text-primary">STYLESWAP_BASE_URL=</span>https://api.styleswap.com</div>
              <div><span className="text-primary">WEBHOOK_SECRET=</span>whsec_xxxxx</div>
            </div>
            <p className="text-sm text-muted-foreground">
              Never commit API keys to version control. Use .env files and add them to .gitignore.
            </p>
          </CardContent>
        </Card>

        {/* Support */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Resources</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="/api-docs" className="text-primary hover:underline">
                      API Documentation
                    </a>
                  </li>
                  <li>
                    <a href="/error-codes" className="text-primary hover:underline">
                      Error Codes Reference
                    </a>
                  </li>
                  <li>
                    <a href="/webhook-payloads" className="text-primary hover:underline">
                      Webhook Payloads
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Support</h4>
                <ul className="space-y-2 text-sm">
                  <li>Email: support@styleswap.com</li>
                  <li>Slack: Join our developer community</li>
                  <li>GitHub: Report issues and contribute</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
