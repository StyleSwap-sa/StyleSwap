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
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="payments">Payments</TabsTrigger>
                <TabsTrigger value="tryons">Try-Ons</TabsTrigger>
                <TabsTrigger value="customers">Customers</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
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

              {/* Payments Endpoints */}
              <TabsContent value="payments" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Get Payment Packages</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted p-3 rounded">
                      <code className="text-sm">GET /api/payments/packages</code>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">Returns all available credit packages with pricing</p>
                    <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                      <pre className="text-sm">{`[
  {
    "id": "pkg_10",
    "name": "Starter",
    "credits": 10,
    "price": 45.00,
    "currency": "ZAR"
  },
  {
    "id": "pkg_50",
    "name": "Professional",
    "credits": 50,
    "price": 150.00,
    "currency": "ZAR"
  }
]`}</pre>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Create Payment Checkout</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted p-3 rounded">
                      <code className="text-sm">POST /api/payments/checkout</code>
                    </div>
                    <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                      <pre className="text-sm">{`Request:
{
  "packageId": "pkg_50",
  "successUrl": "https://yoursite.com/success",
  "cancelUrl": "https://yoursite.com/cancel"
}

Response:
{
  "id": "checkout_abc123",
  "status": "pending",
  "amount": 150.00,
  "currency": "ZAR",
  "credits": 50,
  "checkoutUrl": "https://checkout.yoco.com/abc123"
}`}</pre>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Confirm Payment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted p-3 rounded">
                      <code className="text-sm">POST /api/payments/confirm</code>
                    </div>
                    <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                      <pre className="text-sm">{`Request:
{
  "paymentIntentId": "checkout_abc123",
  "packageId": "pkg_50",
  "credits": 50
}

Response:
{
  "success": true,
  "credits": 50,
  "expiresAt": "2026-03-09T00:00:00Z",
  "message": "Payment successful"
}`}</pre>
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
                      <code className="text-sm">POST /api/tryons/generate</code>
                    </div>
                    <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                      <pre className="text-sm">{`{
  "customerId": "cust_123",
  "productId": "prod_456",
  "photoUrl": "https://...",
  "type": "top"
}`}</pre>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Get Try-On Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted p-3 rounded">
                      <code className="text-sm">GET /api/tryons/{'{tryonId}'}</code>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Customers Endpoints */}
              <TabsContent value="customers" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Create Customer</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted p-3 rounded">
                      <code className="text-sm">POST /api/customers</code>
                    </div>
                    <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                      <pre className="text-sm">{`{
  "email": "customer@example.com",
  "name": "John Doe",
  "externalId": "user_123"
}`}</pre>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Analytics Endpoints */}
              <TabsContent value="analytics" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Get Analytics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-muted p-3 rounded">
                      <code className="text-sm">GET /api/analytics?startDate=2026-01-01&endDate=2026-02-09</code>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Returns metrics like total try-ons, conversion rates, and average response times.
                    </p>
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
            <h2 className="text-3xl font-bold mb-6">Payment Processing</h2>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Payment Flow Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  StyleSwap uses Yoco as the payment gateway for secure credit card processing in South Africa.
                </p>
                <div className="bg-muted p-4 rounded-lg space-y-3">
                  <div className="font-mono text-sm">
                    <div className="font-bold text-primary mb-2">Payment Processing Steps:</div>
                    <div className="space-y-2">
                      <div>1. Get available packages → GET /api/payments/packages</div>
                      <div>2. Create checkout → POST /api/payments/checkout</div>
                      <div>3. Redirect to Yoco → User completes payment</div>
                      <div>4. Confirm payment → POST /api/payments/confirm</div>
                      <div>5. Credits added → Boutique can use try-ons</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Webhook Events</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground mb-4">
                  Real-time payment notifications sent to your webhook endpoint:
                </p>
                <div className="space-y-3">
                  <div className="border-l-4 border-primary pl-4">
                    <div className="font-mono text-sm font-bold">payment.completed</div>
                    <p className="text-sm text-muted-foreground mt-1">Triggered when payment is successfully processed and credits are added</p>
                  </div>
                  <div className="border-l-4 border-destructive pl-4">
                    <div className="font-mono text-sm font-bold">payment.failed</div>
                    <p className="text-sm text-muted-foreground mt-1">Triggered when payment processing fails</p>
                  </div>
                  <div className="border-l-4 border-yellow-500 pl-4">
                    <div className="font-mono text-sm font-bold">payment.pending</div>
                    <p className="text-sm text-muted-foreground mt-1">Triggered when payment is awaiting confirmation</p>
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
                  <CardTitle>API Key Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate, manage, and revoke API keys from your dashboard.
                  </p>
                  <Button asChild>
                    <a href="/api-keys">Manage API Keys</a>
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
