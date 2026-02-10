import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code2, BookOpen, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export default function RetailerIntegrationGuides() {
  const guides = [
    {
      name: 'Mr Price',
      logo: '🏪',
      description: 'South Africa\'s leading fashion retailer',
      difficulty: 'Intermediate',
      estimatedTime: '2-3 hours',
      features: ['Product Catalog Sync', 'Try-On Generation', 'Customer Analytics', 'Webhook Integration'],
    },
    {
      name: 'Foschini',
      logo: '👗',
      description: 'Premium fashion and lifestyle retailer',
      difficulty: 'Advanced',
      estimatedTime: '3-4 hours',
      features: ['Advanced Filtering', 'Multi-Brand Support', 'Custom Branding', 'Real-time Sync'],
    },
    {
      name: 'Shein',
      logo: '🛍️',
      description: 'Global fast fashion e-commerce platform',
      difficulty: 'Advanced',
      estimatedTime: '4-5 hours',
      features: ['Bulk Product Import', 'Multi-Language Support', 'Currency Conversion', 'Scale Optimization'],
    },
    {
      name: 'Legit',
      logo: '✓',
      description: 'Authentic fashion and lifestyle marketplace',
      difficulty: 'Intermediate',
      estimatedTime: '2-3 hours',
      features: ['Seller Integration', 'Product Verification', 'Multi-Seller Support', 'Credit-Based Payments'],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/5">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Retailer Integration Guides</h1>
          <p className="text-lg text-primary-foreground/90 max-w-2xl">
            Step-by-step guides for integrating StyleSwap into your e-commerce platform.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Quick Links */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {guides.map((guide) => (
            <Card
              key={guide.name}
              className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary"
            >
              <CardHeader className="pb-3">
                <div className="text-4xl mb-2">{guide.logo}</div>
                <CardTitle className="text-lg">{guide.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{guide.description}</p>
                <div className="space-y-1 text-xs">
                  <p>
                    <span className="font-semibold">Difficulty:</span> {guide.difficulty}
                  </p>
                  <p>
                    <span className="font-semibold">Time:</span> {guide.estimatedTime}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Detailed Guides */}
        <Tabs defaultValue="mr-price" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="mr-price">Mr Price</TabsTrigger>
            <TabsTrigger value="foschini">Foschini</TabsTrigger>
            <TabsTrigger value="shein">Shein</TabsTrigger>
            <TabsTrigger value="legit">Legit</TabsTrigger>
          </TabsList>

          {/* Mr Price Guide */}
          <TabsContent value="mr-price" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Mr Price Integration Guide
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Prerequisites */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Prerequisites</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Active StyleSwap account with API credentials</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Access to Mr Price e-commerce platform backend</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Development environment for testing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Webhook endpoint URL for receiving events</span>
                    </li>
                  </ul>
                </div>

                {/* Step 1 */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-3">Step 1: Obtain API Credentials</h3>
                  <div className="bg-muted p-4 rounded-lg space-y-3">
                    <p className="text-sm">
                      1. Log in to your StyleSwap Developer Portal at{' '}
                      <code className="bg-background px-2 py-1 rounded text-xs">/developer</code>
                    </p>
                    <p className="text-sm">
                      2. Navigate to <strong>API Keys</strong> section
                    </p>
                    <p className="text-sm">
                      3. Click <strong>Create New Key</strong> and name it "Mr Price Production"
                    </p>
                    <p className="text-sm">
                      4. Copy the API key and store it securely in your environment variables
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-3">Step 2: Set Up Product Catalog Sync</h3>
                  <div className="bg-muted p-4 rounded-lg space-y-3">
                    <p className="text-sm font-semibold">Use the Products API to sync your catalog:</p>
                    <pre className="bg-background p-3 rounded text-xs overflow-x-auto">
{`const styleswapApi = require('styleswap-sdk');

const client = new styleswapApi.Client({
  apiKey: process.env.STYLESWAP_API_KEY,
});

// Sync Mr Price products to StyleSwap
async function syncProducts() {
  const mrpriceProducts = await fetchMrPriceProducts();
  
  for (const product of mrpriceProducts) {
    await client.products.create({
      externalId: product.id,
      name: product.name,
      description: product.description,
      imageUrl: product.imageUrl,
      sizes: product.sizes,
      colors: product.colors,
      price: product.price,
    });
  }
}

syncProducts();`}
                    </pre>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-3">Step 3: Integrate Try-On Generation</h3>
                  <div className="bg-muted p-4 rounded-lg space-y-3">
                    <p className="text-sm font-semibold">Add try-on button to product pages:</p>
                    <pre className="bg-background p-3 rounded text-xs overflow-x-auto">
{`// On Mr Price product page
async function generateTryOn(customerId, productId, bodyPhotoUrl) {
  const response = await client.tryons.generate({
    customerId: customerId,
    productId: productId,
    bodyPhotoUrl: bodyPhotoUrl,
  });
  
  // Display try-on image
  displayTryOnImage(response.imageUrl);
  
  // Track try-on event
  trackEvent('try_on_generated', {
    productId: productId,
    customerId: customerId,
  });
}

// Button click handler
document.getElementById('try-on-btn').addEventListener('click', async () => {
  const bodyPhoto = await captureBodyPhoto();
  const tryon = await generateTryOn(
    getCurrentCustomerId(),
    getCurrentProductId(),
    bodyPhoto
  );
});`}
                    </pre>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-3">Step 4: Set Up Webhooks</h3>
                  <div className="bg-muted p-4 rounded-lg space-y-3">
                    <p className="text-sm font-semibold">Configure webhook endpoint:</p>
                    <pre className="bg-background p-3 rounded text-xs overflow-x-auto">
{`// Mr Price webhook handler
app.post('/webhooks/styleswap', (req, res) => {
  const event = req.body;
  
  switch (event.type) {
    case 'tryon.generated':
      handleTryOnGenerated(event.data);
      break;
    case 'tryon.failed':
      handleTryOnFailed(event.data);
      break;
    case 'credits.depleted':
      alertAdminLowCredits(event.data);
      break;
  }
  
  res.json({ received: true });
});

function handleTryOnGenerated(data) {
  // Save try-on to customer profile
  saveCustomerTryOn(data.customerId, {
    productId: data.productId,
    imageUrl: data.imageUrl,
    timestamp: data.timestamp,
  });
}

function handleTryOnFailed(data) {
  // Notify customer of failure
  notifyCustomer(data.customerId, 
    'Try-on generation failed. Please try again.');
}`}
                    </pre>
                  </div>
                </div>

                {/* Testing */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-3">Testing Your Integration</h3>
                  <div className="space-y-3">
                    <p className="text-sm">
                      Use the <strong>Webhook Testing Console</strong> to test your webhooks before going live:
                    </p>
                    <Button asChild variant="outline" className="w-full">
                      <a href="/webhook-testing">
                        Open Webhook Testing Console <ArrowRight className="ml-2 w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                </div>

                {/* Deployment */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-3">Deployment Checklist</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <input type="checkbox" className="mt-1" />
                      <span className="text-sm">API credentials stored securely in environment variables</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <input type="checkbox" className="mt-1" />
                      <span className="text-sm">Product catalog synced successfully</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <input type="checkbox" className="mt-1" />
                      <span className="text-sm">Try-on generation tested on staging</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <input type="checkbox" className="mt-1" />
                      <span className="text-sm">Webhooks receiving events correctly</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <input type="checkbox" className="mt-1" />
                      <span className="text-sm">Error handling implemented</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <input type="checkbox" className="mt-1" />
                      <span className="text-sm">Rate limiting configured</span>
                    </li>
                  </ul>
                </div>

                {/* Support */}
                <div className="border-t pt-6 bg-blue-50 p-4 rounded-lg">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-sm text-blue-900">Need Help?</h4>
                      <p className="text-sm text-blue-800 mt-1">
                        Contact our integration team at{' '}
                        <a href="mailto:integrations@styleswap.com" className="underline font-semibold">
                          integrations@styleswap.com
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Foschini Guide */}
          <TabsContent value="foschini" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Foschini Integration Guide
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-muted-foreground">
                  Foschini integration guide with advanced features like multi-brand support and custom branding coming soon.
                </p>
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Key Features for Foschini:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Multi-brand product catalog management</li>
                    <li>• Custom branding and white-label options</li>
                    <li>• Advanced filtering and search integration</li>
                    <li>• Real-time inventory synchronization</li>
                    <li>• Premium customer analytics dashboard</li>
                  </ul>
                </div>
                <Button asChild className="w-full">
                  <a href="/api-docs">
                    View API Documentation <ArrowRight className="ml-2 w-4 h-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Shein Guide */}
          <TabsContent value="shein" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Shein Integration Guide
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-muted-foreground">
                  Shein integration guide for global fast fashion e-commerce platform coming soon.
                </p>
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Key Features for Shein:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Bulk product import and export</li>
                    <li>• Multi-language support (20+ languages)</li>
                    <li>• Currency conversion and localization</li>
                    <li>• High-volume performance optimization</li>
                    <li>• Global webhook distribution</li>
                  </ul>
                </div>
                <Button asChild className="w-full">
                  <a href="/api-docs">
                    View API Documentation <ArrowRight className="ml-2 w-4 h-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Legit Guide */}
          <TabsContent value="legit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Legit Integration Guide
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-muted-foreground">
                  Legit marketplace integration guide for multi-seller support coming soon.
                </p>
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Key Features for Legit:</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Multi-seller product catalog</li>
                    <li>• Seller verification and authentication</li>
                    <li>• Credit-based payment system</li>
                    <li>• Seller analytics and reporting</li>
                    <li>• Marketplace webhook routing</li>
                  </ul>
                </div>
                <Button asChild className="w-full">
                  <a href="/api-docs">
                    View API Documentation <ArrowRight className="ml-2 w-4 h-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* General Integration Best Practices */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle>General Integration Best Practices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Security
                </h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Always use HTTPS for API calls</li>
                  <li>• Store API keys in environment variables</li>
                  <li>• Implement rate limiting (100 req/min)</li>
                  <li>• Validate webhook signatures</li>
                  <li>• Use API key rotation every 90 days</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Performance
                </h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Implement caching for product data</li>
                  <li>• Use batch endpoints for bulk operations</li>
                  <li>• Set appropriate timeouts (30s)</li>
                  <li>• Monitor API response times</li>
                  <li>• Implement exponential backoff for retries</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Reliability
                </h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Implement error handling for all API calls</li>
                  <li>• Set up monitoring and alerting</li>
                  <li>• Log all API interactions</li>
                  <li>• Implement circuit breaker pattern</li>
                  <li>• Test failover scenarios</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Support
                </h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Monitor webhook delivery logs</li>
                  <li>• Implement customer support tickets</li>
                  <li>• Track integration metrics</li>
                  <li>• Maintain integration documentation</li>
                  <li>• Schedule regular sync checks</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
