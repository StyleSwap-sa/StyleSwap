import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code2, FileText, BookOpen, ExternalLink, Copy, Check } from 'lucide-react';

export default function ApiDocumentation() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/5">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-4">
            <Code2 className="w-12 h-12" />
            <h1 className="text-4xl md:text-5xl font-bold">StyleSwap API</h1>
          </div>
          <p className="text-lg text-primary-foreground/90 max-w-2xl">
            Integrate virtual try-on technology into your retail platform. Build, test, and deploy with our comprehensive API.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <BookOpen className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Getting Started</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Learn how to authenticate and make your first API request.
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href="#getting-started">Read Guide</a>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <FileText className="w-8 h-8 text-primary mb-2" />
              <CardTitle>API Reference</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Complete reference for all API endpoints and parameters.
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href="#api-reference">View Reference</a>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Code2 className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Code Examples</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Integration examples in Node.js, Python, and more.
              </p>
              <Button variant="outline" size="sm" asChild>
                <a href="#examples">View Examples</a>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Documentation */}
        <div className="space-y-12">
          {/* Getting Started */}
          <section id="getting-started" className="scroll-mt-20">
            <h2 className="text-3xl font-bold mb-6">Getting Started</h2>
            
            <Card>
              <CardHeader>
                <CardTitle>Authentication</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  All API requests require an API key. Generate your key from the API Key Management dashboard.
                </p>
                
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <code className="text-sm font-mono">Authorization: Bearer sk_your_api_key</code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard('Authorization: Bearer sk_your_api_key', 'auth-header')}
                    >
                      {copiedCode === 'auth-header' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  Include this header in all your API requests.
                </p>
              </CardContent>
            </Card>
          </section>

          {/* API Reference */}
          <section id="api-reference" className="scroll-mt-20">
            <h2 className="text-3xl font-bold mb-6">API Reference</h2>

            <Tabs defaultValue="products" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="tryons">Try-Ons</TabsTrigger>
              </TabsList>

              {/* Products Endpoints */}
              <TabsContent value="products" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Create Product</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted p-3 rounded">
                      <code className="text-sm">POST /api/products</code>
                    </div>
                    <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                      <pre className="text-sm">{`{
  "name": "Blue Dress",
  "description": "Elegant blue summer dress",
  "imageUrl": "https://...",
  "category": "dresses",
  "price": 49.99
}`}</pre>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">List Products</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted p-3 rounded">
                      <code className="text-sm">GET /api/products?limit=50&offset=0</code>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>



              {/* Try-Ons Endpoints */}
              <TabsContent value="tryons" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Generate Try-On</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted p-3 rounded">
                      <code className="text-sm">POST /api/trpc/protectedApi.generateTryOn</code>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Request Body:</p>
                      <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                        <pre className="text-sm">{`{
  "apiKey": "sk_live_xxxxx",
  "productId": "prod_123",
  "productName": "Blue Dress",
  "userImage": "https://example.com/user.jpg",
  "garmentImage": "https://example.com/garment.jpg"
}`}</pre>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Response (Success):</p>
                      <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                        <pre className="text-sm">{`{
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
}`}</pre>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Rate Limit:</p>
                      <p className="text-sm text-muted-foreground">100 requests per minute. Returns 429 if exceeded.</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Get API Usage Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted p-3 rounded">
                      <code className="text-sm">GET /api/trpc/protectedApi.getUsageStats</code>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Query Parameters:</p>
                      <div className="bg-muted p-4 rounded-lg">
                        <pre className="text-sm">apiKey: sk_live_xxxxx
period: 24h (1h, 24h, 7d, 30d)</pre>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Response:</p>
                      <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                        <pre className="text-sm">{`{
  "success": true,
  "data": {
    "totalRequests": 1250,
    "successfulRequests": 1200,
    "failedRequests": 50,
    "averageResponseTime": 2400,
    "quotaUsed": 1200,
    "quotaLimit": 5000
  }
}`}</pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>


            </Tabs>
          </section>

          {/* Code Examples */}
          <section id="examples" className="scroll-mt-20">
            <h2 className="text-3xl font-bold mb-6">Code Examples</h2>

            <Tabs defaultValue="nodejs" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="nodejs">Node.js</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
              </TabsList>

              <TabsContent value="nodejs">
                <Card>
                  <CardHeader>
                    <CardTitle>Node.js SDK Example</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                      <pre className="text-sm">{`import { StyleSwapAPI } from '@styleswap/sdk';

const styleswap = new StyleSwapAPI({
  apiKey: process.env.STYLESWAP_API_KEY,
});

// Generate try-on
const tryon = await styleswap.tryons.generate({
  customerId: 'cust_123',
  productId: 'prod_456',
  photoUrl: 'https://...',
  type: 'top',
});

// Poll for completion
let result = tryon;
while (result.status === 'processing') {
  await new Promise(r => setTimeout(r, 2000));
  result = await styleswap.tryons.get(tryon.id);
}

console.log('Try-on result:', result.imageUrl);`}</pre>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => copyToClipboard(
                        `import { StyleSwapAPI } from '@styleswap/sdk';\n\nconst styleswap = new StyleSwapAPI({\n  apiKey: process.env.STYLESWAP_API_KEY,\n});\n\nconst tryon = await styleswap.tryons.generate({...});`,
                        'nodejs-example'
                      )}
                    >
                      {copiedCode === 'nodejs-example' ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                      Copy Code
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="python">
                <Card>
                  <CardHeader>
                    <CardTitle>Python SDK Example</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                      <pre className="text-sm">{`from styleswap_sdk import StyleSwapAPI
import time

styleswap = StyleSwapAPI(api_key='your_api_key')

# Generate try-on
tryon = styleswap.tryons.generate(
    customer_id='cust_123',
    product_id='prod_456',
    photo_url='https://...',
    type='top'
)

# Poll for completion
while True:
    result = styleswap.tryons.get(tryon['id'])
    if result['status'] != 'processing':
        break
    time.sleep(2)

print('Try-on result:', result['image_url'])`}</pre>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => copyToClipboard(
                        `from styleswap_sdk import StyleSwapAPI\n\nstyleswap = StyleSwapAPI(api_key='your_api_key')\ntryon = styleswap.tryons.generate(...)`,
                        'python-example'
                      )}
                    >
                      {copiedCode === 'python-example' ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                      Copy Code
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </section>

          {/* Payment Processing */}
          <section id="payment-processing" className="scroll-mt-20">
            <h2 className="text-3xl font-bold mb-6">Credits & Pricing</h2>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>How Credits Work</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  StyleSwap uses a simple credit-based model. Purchase credits and use them to generate try-ons. Each try-on costs 1 credit.
                </p>
                <div className="bg-muted p-4 rounded-lg space-y-3">
                  <div className="font-mono text-sm">
                    <div className="font-bold text-primary mb-3">Credit Pricing (Volume Discounts):</div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>100 try-ons</span>
                        <span className="text-right">
                          <div className="font-bold">R385.00</div>
                          <div className="text-xs text-muted-foreground">R3.85/try-on</div>
                        </span>
                      </div>
                      <div className="border-t border-muted-foreground/20"></div>
                      <div className="flex justify-between items-center">
                        <span>200 try-ons</span>
                        <span className="text-right">
                          <div className="font-bold">R750.00</div>
                          <div className="text-xs text-muted-foreground">R3.75/try-on</div>
                        </span>
                      </div>
                      <div className="border-t border-muted-foreground/20"></div>
                      <div className="flex justify-between items-center">
                        <span>500 try-ons</span>
                        <span className="text-right">
                          <div className="font-bold">R1,350.00</div>
                          <div className="text-xs text-muted-foreground">R2.70/try-on</div>
                        </span>
                      </div>
                      <div className="border-t border-muted-foreground/20"></div>
                      <div className="flex justify-between items-center">
                        <span>1,000 try-ons</span>
                        <span className="text-right">
                          <div className="font-bold">R2,200.00</div>
                          <div className="text-xs text-muted-foreground">R2.20/try-on</div>
                        </span>
                      </div>
                      <div className="border-t border-muted-foreground/20"></div>
                      <div className="flex justify-between items-center">
                        <span>5,000 try-ons</span>
                        <span className="text-right">
                          <div className="font-bold">R6,250.00</div>
                          <div className="text-xs text-muted-foreground">R1.25/try-on</div>
                        </span>
                      </div>
                      <div className="border-t border-muted-foreground/20"></div>
                      <div className="flex justify-between items-center bg-primary/10 p-2 rounded">
                        <span className="font-semibold">20,000 try-ons</span>
                        <span className="text-right">
                          <div className="font-bold text-primary">R18,600.00</div>
                          <div className="text-xs text-muted-foreground">R0.93/try-on</div>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  <strong>Note:</strong> Credits expire 30 days after purchase. Purchase additional credits anytime without restrictions.
                </p>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Purchase Flow</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-lg space-y-3">
                  <div className="font-mono text-sm">
                    <div className="font-bold text-primary mb-2">Steps to Purchase Credits:</div>
                    <div className="space-y-2">
                      <div>1. Call GET /api/billing/getCreditTiers to see available packages</div>
                      <div>2. Call POST /api/billing/initiatePurchase with desired package</div>
                      <div>3. Redirect user to Yoco checkout URL</div>
                      <div>4. After payment, credits are automatically added to account</div>
                      <div>5. Start generating try-ons immediately</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Credit Webhook Events</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground mb-4">
                  Real-time notifications for credit purchases and usage:
                </p>
                <div className="space-y-3">
                  <div className="border-l-4 border-primary pl-4">
                    <div className="font-mono text-sm font-bold">credits.purchased</div>
                    <p className="text-sm text-muted-foreground mt-1">Triggered when credits are successfully purchased</p>
                  </div>
                  <div className="border-l-4 border-primary pl-4">
                    <div className="font-mono text-sm font-bold">credits.used</div>
                    <p className="text-sm text-muted-foreground mt-1">Triggered when credits are used for a try-on</p>
                  </div>
                  <div className="border-l-4 border-yellow-500 pl-4">
                    <div className="font-mono text-sm font-bold">credits.expired</div>
                    <p className="text-sm text-muted-foreground mt-1">Triggered when credits expire (30 days after purchase)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Webhooks */}
          <section id="webhooks" className="scroll-mt-20">
            <h2 className="text-3xl font-bold mb-6">Webhooks</h2>

            <Card>
              <CardHeader>
                <CardTitle>Webhook Events</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Subscribe to real-time events from StyleSwap:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    <code className="text-sm">tryon.generated</code> - Try-on successfully generated
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    <code className="text-sm">tryon.failed</code> - Try-on generation failed
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    <code className="text-sm">customer.created</code> - New customer registered
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    <code className="text-sm">payment.completed</code> - Payment received
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Support */}
          <section id="support" className="scroll-mt-20 mb-12">
            <h2 className="text-3xl font-bold mb-6">Support & Resources</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Error Codes & Troubleshooting</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Complete reference for HTTP status codes, error handling, and retry strategies.
                  </p>
                  <Button asChild>
                    <a href="/error-codes">View Error Codes</a>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Webhook Events & Payloads</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Webhook event types, payload examples, and signature verification.
                  </p>
                  <Button asChild>
                    <a href="/webhook-payloads">View Webhooks</a>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>SDK Installation & Integration</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Official SDKs for Node.js, Python, and integration examples.
                  </p>
                  <Button asChild>
                    <a href="/sdk-guide">View SDK Guide</a>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>API Key Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate, manage, and revoke API keys from your dashboard.
                  </p>
                  <Button asChild>
                    <a href="/developer">Manage API Keys</a>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Full Documentation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Download the complete API implementation guide.
                  </p>
                  <Button variant="outline" asChild>
                    <a href="/API_IMPLEMENTATION_GUIDE.md" target="_blank" rel="noopener noreferrer">
                      Download PDF <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
