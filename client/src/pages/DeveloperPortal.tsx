import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code2, Key, Webhook, BookOpen, ArrowRight, CheckCircle2, Zap, Shield } from "lucide-react";

export default function DeveloperPortal() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Developer Portal</h1>
              <p className="text-slate-600 mt-1">Integrate StyleSwap's virtual try-on API into your platform</p>
            </div>
            <Link href="/api-docs">
              <Button className="bg-orange-600 hover:bg-orange-700">
                Get Started <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="widget">Widget</TabsTrigger>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            <TabsTrigger value="guides">Guides</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Quick Start */}
            <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-600" />
                  Quick Start in 3 Steps
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-600 text-white font-bold">1</div>
                    <h3 className="font-semibold text-slate-900">Register Your App</h3>
                    <p className="text-sm text-slate-600">Create a developer account and register your application</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-600 text-white font-bold">2</div>
                    <h3 className="font-semibold text-slate-900">Get API Keys</h3>
                    <p className="text-sm text-slate-600">Generate API keys for authentication</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-600 text-white font-bold">3</div>
                    <h3 className="font-semibold text-slate-900">Integrate & Deploy</h3>
                    <p className="text-sm text-slate-600">Use our SDK to integrate try-ons into your platform</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features Grid */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Why Choose StyleSwap API?</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Code2 className="w-5 h-5 text-orange-600" />
                      Easy Integration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600">RESTful API with comprehensive documentation and SDKs in multiple languages. Integrate in hours, not weeks.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Zap className="w-5 h-5 text-orange-600" />
                      Fast Processing
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600">Generate photorealistic try-ons in under 15 seconds. Optimized for high-volume retail operations.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Shield className="w-5 h-5 text-orange-600" />
                      Secure & Reliable
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600">Enterprise-grade security with 99.9% uptime SLA. PCI-compliant payment processing.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <BookOpen className="w-5 h-5 text-orange-600" />
                      Full Documentation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600">Complete API reference, code examples, and integration guides for all major platforms.</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Pricing */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Simple, Transparent Pricing</h2>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-3 border-b">
                      <span className="text-slate-700">100 try-ons</span>
                      <span className="font-semibold text-slate-900">R385 (R3.85/try-on)</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b">
                      <span className="text-slate-700">500 try-ons</span>
                      <span className="font-semibold text-slate-900">R1,350 (R2.70/try-on)</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b">
                      <span className="text-slate-700">1,000 try-ons</span>
                      <span className="font-semibold text-slate-900">R2,200 (R2.20/try-on)</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b">
                      <span className="text-slate-700">5,000 try-ons</span>
                      <span className="font-semibold text-slate-900">R6,250 (R1.25/try-on)</span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <span className="text-slate-700">20,000 try-ons</span>
                      <span className="font-semibold text-slate-900">R18,600 (R0.93/try-on)</span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mt-6">Credits expire after 30 days. Enterprise customers can negotiate custom rates.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Widget Tab */}
          <TabsContent value="widget" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-orange-600" />
                  StyleSwap Widget
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-sm text-orange-900">
                    <strong>No-Code Solution:</strong> Embed the StyleSwap widget on your website with just a few lines of code. Perfect for Shopify, WooCommerce, and custom sites.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">Quick Setup</h3>
                  <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-auto">
                    <pre>{`<!-- Add this to your HTML -->
<div id="styleswap-widget"></div>

<script src="https://styleswap.com/widget.js"><\/script>
<script>
  StyleSwapWidget.init({
    apiKey: "sk_your_api_key",
    productId: "prod_123",
    productName: "Your Product",
    containerId: "styleswap-widget"
  });
<\/script>`}</pre>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-slate-900">For Shopify</h4>
                    <p className="text-sm text-slate-600">Add the embed code to your product template. Works with any Shopify theme.</p>
                    <Button variant="outline" className="w-full mt-2">View Shopify Guide</Button>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-slate-900">For WooCommerce</h4>
                    <p className="text-sm text-slate-600">Install as a plugin or add code to your product page template.</p>
                    <Button variant="outline" className="w-full mt-2">View WooCommerce Guide</Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">Customization Options</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-slate-900">Custom Colors</p>
                        <p className="text-sm text-slate-600">Match your brand with custom primary and accent colors</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-slate-900">Responsive Design</p>
                        <p className="text-sm text-slate-600">Works perfectly on mobile and desktop devices</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-slate-900">Analytics</p>
                        <p className="text-sm text-slate-600">Track try-on usage and customer engagement</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Link href="/widget-builder" className="flex-1">
                    <Button className="flex-1 bg-orange-600 hover:bg-orange-700">
                      Go to Widget Builder
                    </Button>
                  </Link>
                  <Link href="/rate-limiting" className="flex-1">
                    <Button variant="outline" className="flex-1">
                      View Rate Limiting Docs
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="api-keys" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-orange-600" />
                  API Key Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>Note:</strong> You must be logged in as a registered developer to manage API keys. 
                    <Link href="/api-keys" className="text-blue-600 hover:underline ml-1">Register your application</Link>
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">Your API Keys</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-slate-50 px-6 py-3 border-b flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">Key Name</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">Key</p>
                      </div>
                      <div className="w-32">
                        <p className="text-sm font-medium text-slate-900">Status</p>
                      </div>
                      <div className="w-20">
                        <p className="text-sm font-medium text-slate-900">Actions</p>
                      </div>
                    </div>
                    <div className="px-6 py-4 border-b flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-slate-900 font-medium">Production</p>
                      </div>
                      <div className="flex-1">
                        <p className="text-slate-600 font-mono text-sm">sk_live_••••••••••••••••</p>
                      </div>
                      <div className="w-32">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      </div>
                      <div className="w-20 flex gap-2">
                        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">View</button>
                        <button className="text-red-600 hover:text-red-700 text-sm font-medium">Revoke</button>
                      </div>
                    </div>
                  </div>
                </div>

                <Link href="/api-keys">
                  <Button className="bg-orange-600 hover:bg-orange-700">
                    <Key className="w-4 h-4 mr-2" />
                    Generate New Key
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Security Best Practices */}
            <Card>
              <CardHeader>
                <CardTitle>Security Best Practices</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">Keep keys confidential</p>
                    <p className="text-sm text-slate-600">Never commit API keys to version control or share them publicly</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">Rotate keys regularly</p>
                    <p className="text-sm text-slate-600">Generate new keys and revoke old ones every 90 days</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">Use environment variables</p>
                    <p className="text-sm text-slate-600">Store keys in .env files or environment variables, never hardcode</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">Monitor usage</p>
                    <p className="text-sm text-slate-600">Check API usage regularly for unusual activity</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Webhooks Tab */}
          <TabsContent value="webhooks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="w-5 h-5 text-orange-600" />
                  Webhook Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>Note:</strong> Webhook management is available in your developer dashboard. 
                    <Link href="/api-keys" className="text-blue-600 hover:underline ml-1">Go to dashboard</Link>
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-900">Available Webhook Events</h3>
                  <div className="space-y-3">
                    <div className="border rounded-lg p-4">
                      <p className="font-mono text-sm font-medium text-orange-600">tryon.generated</p>
                      <p className="text-sm text-slate-600 mt-1">Fired when a try-on image is successfully generated</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <p className="font-mono text-sm font-medium text-orange-600">tryon.failed</p>
                      <p className="text-sm text-slate-600 mt-1">Fired when try-on generation fails</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <p className="font-mono text-sm font-medium text-orange-600">credits.purchased</p>
                      <p className="text-sm text-slate-600 mt-1">Fired when credits are successfully purchased</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <p className="font-mono text-sm font-medium text-orange-600">credits.depleted</p>
                      <p className="text-sm text-slate-600 mt-1">Fired when credits run out</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-slate-900">Example Webhook Payload</h4>
                  <pre className="bg-slate-900 text-slate-100 p-3 rounded text-xs overflow-x-auto">
{`{
  "id": "evt_1234567890",
  "event": "tryon.generated",
  "timestamp": "2026-02-09T12:00:00Z",
  "data": {
    "tryonId": "tryon_abc123",
    "imageUrl": "https://cdn.styleswap.com/...",
    "processingTime": 8500,
    "success": true
  }
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Guides Tab */}
          <TabsContent value="guides" className="space-y-6">
            <div className="mb-6">
              <Button asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                <a href="/integration-guides">
                  View Complete Integration Guides <ArrowRight className="ml-2 w-4 h-4" />
                </a>
              </Button>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">Getting Started</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-4">Learn the basics of StyleSwap API integration in 10 minutes</p>
                  <Button variant="outline" className="w-full">
                    Read Guide <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">API Reference</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-4">Complete API documentation with all endpoints and parameters</p>
                  <Button variant="outline" className="w-full">
                    View Reference <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">Mr Price Integration</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-4">Step-by-step guide for integrating with Mr Price's platform</p>
                  <Button variant="outline" className="w-full">
                    View Guide <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">Foschini Integration</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-4">Integration guide for Foschini's e-commerce platform</p>
                  <Button variant="outline" className="w-full">
                    View Guide <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">Code Examples</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-4">Ready-to-use code samples in Node.js, Python, and more</p>
                  <Button variant="outline" className="w-full">
                    View Examples <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">Webhook Testing</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-4">Test webhook deliveries and debug integration issues</p>
                  <Button variant="outline" className="w-full" asChild>
                    <a href="/webhook-testing">
                      Test Webhooks <ArrowRight className="ml-2 w-4 h-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white py-16 mt-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-orange-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of retailers using StyleSwap to increase conversion rates and reduce returns
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-white text-orange-600 hover:bg-orange-50 font-semibold">
              Register Your App
            </Button>
            <Button variant="outline" className="border-white text-white hover:bg-orange-700">
              View Documentation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
