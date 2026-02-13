import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code2, Copy, Check, ArrowRight } from "lucide-react";

export default function ApiDocs() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">API Documentation</h1>
              <p className="text-slate-600 mt-1">Complete reference for StyleSwap's virtual try-on API</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-2">
              <div className="text-sm font-semibold text-slate-900 mb-4">Documentation</div>
              <nav className="space-y-2">
                <a href="#authentication" className="block text-sm text-slate-600 hover:text-orange-600 transition">Authentication</a>
                <a href="#endpoints" className="block text-sm text-slate-600 hover:text-orange-600 transition">Endpoints</a>
                <a href="#try-on" className="block text-sm text-slate-600 hover:text-orange-600 transition">Create Try-On</a>
                <a href="#billing" className="block text-sm text-slate-600 hover:text-orange-600 transition">Pricing</a>
                <a href="#webhooks" className="block text-sm text-slate-600 hover:text-orange-600 transition">Webhooks</a>
                <a href="#errors" className="block text-sm text-slate-600 hover:text-orange-600 transition">Error Handling</a>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-12">
            {/* Authentication */}
            <section id="authentication" className="scroll-mt-20">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Authentication</h2>
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <p className="text-slate-600">All API requests require authentication using your API key. Include it in the request header:</p>
                  <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-auto relative group">
                    <pre>{`Authorization: Bearer sk_your_api_key`}</pre>
                    <button
                      onClick={() => copyToClipboard("Authorization: Bearer sk_your_api_key", "auth")}
                      className="absolute top-2 right-2 p-2 bg-slate-700 hover:bg-slate-600 rounded opacity-0 group-hover:opacity-100 transition"
                    >
                      {copiedCode === "auth" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-sm text-slate-600">Get your API key from the <a href="/developer-portal" className="text-orange-600 hover:underline">Developer Portal</a></p>
                </CardContent>
              </Card>
            </section>

            {/* Base URL */}
            <section className="scroll-mt-20">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Base URL</h3>
              <Card>
                <CardContent className="pt-6">
                  <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-auto">
                    <pre>https://api.styleswap.com/v1</pre>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Endpoints */}
            <section id="endpoints" className="scroll-mt-20">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">API Endpoints</h2>
              
              {/* Create Try-On */}
              <div className="space-y-4 mb-8">
                <div>
                  <h3 id="try-on" className="text-lg font-semibold text-slate-900 mb-2">Create Virtual Try-On</h3>
                  <p className="text-slate-600 mb-4">Generate a virtual try-on image for a product</p>
                </div>
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                      <p className="font-mono text-sm bg-slate-100 p-3 rounded">POST /try-ons/create</p>
                      <p className="text-sm text-slate-600">Create a new virtual try-on</p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold text-slate-900">Request Body</h4>
                      <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-auto relative group">
                        <pre>{`{
  "userPhotoUrl": "https://...",
  "garmentImageUrl": "https://...",
  "garmentType": "shirt",
  "size": "M"
}`}</pre>
                        <button
                          onClick={() => copyToClipboard('{\n  "userPhotoUrl": "https://...",\n  "garmentImageUrl": "https://...",\n  "garmentType": "shirt",\n  "size": "M"\n}', "req1")}
                          className="absolute top-2 right-2 p-2 bg-slate-700 hover:bg-slate-600 rounded opacity-0 group-hover:opacity-100 transition"
                        >
                          {copiedCode === "req1" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold text-slate-900">Response</h4>
                      <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-auto relative group">
                        <pre>{`{
  "id": "tryon_123abc",
  "status": "processing",
  "resultUrl": null,
  "createdAt": "2026-02-11T10:30:00Z"
}`}</pre>
                        <button
                          onClick={() => copyToClipboard('{\n  "id": "tryon_123abc",\n  "status": "processing",\n  "resultUrl": null,\n  "createdAt": "2026-02-11T10:30:00Z"\n}', "res1")}
                          className="absolute top-2 right-2 p-2 bg-slate-700 hover:bg-slate-600 rounded opacity-0 group-hover:opacity-100 transition"
                        >
                          {copiedCode === "res1" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Get Try-On Status */}
              <div className="space-y-4 mb-8">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Get Try-On Status</h3>
                  <p className="text-slate-600 mb-4">Check the status of a virtual try-on request</p>
                </div>
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                      <p className="font-mono text-sm bg-slate-100 p-3 rounded">GET /try-ons/{'{id}'}</p>
                      <p className="text-sm text-slate-600">Retrieve try-on status and result</p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold text-slate-900">Response</h4>
                      <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-auto relative group">
                        <pre>{`{
  "id": "tryon_123abc",
  "status": "completed",
  "resultUrl": "https://cdn.styleswap.com/results/...",
  "createdAt": "2026-02-11T10:30:00Z",
  "completedAt": "2026-02-11T10:31:45Z"
}`}</pre>
                        <button
                          onClick={() => copyToClipboard('{\n  "id": "tryon_123abc",\n  "status": "completed",\n  "resultUrl": "https://cdn.styleswap.com/results/...",\n  "createdAt": "2026-02-11T10:30:00Z",\n  "completedAt": "2026-02-11T10:31:45Z"\n}', "res2")}
                          className="absolute top-2 right-2 p-2 bg-slate-700 hover:bg-slate-600 rounded opacity-0 group-hover:opacity-100 transition"
                        >
                          {copiedCode === "res2" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Billing */}
              <div className="space-y-4 mb-8">
                <div>
                  <h3 id="billing" className="text-lg font-semibold text-slate-900 mb-2">Pricing & Credits</h3>
                  <p className="text-slate-600 mb-4">StyleSwap uses a credit-based billing model. Each virtual try-on costs 1 credit.</p>
                </div>
                <Card>
                  <CardContent className="pt-6 space-y-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-slate-900">Individual Plans (Pay-as-you-go)</h4>
                      <div className="space-y-2 text-sm text-slate-600">
                        <div className="flex justify-between p-2 bg-slate-50 rounded">
                          <span>10 try-ons</span>
                          <span className="font-semibold">R45 (R4.50/try-on)</span>
                        </div>
                        <div className="flex justify-between p-2 bg-slate-50 rounded">
                          <span>20 try-ons</span>
                          <span className="font-semibold">R80 (R4.00/try-on)</span>
                        </div>
                        <div className="flex justify-between p-2 bg-slate-50 rounded">
                          <span>50 try-ons</span>
                          <span className="font-semibold">R150 (R3.00/try-on)</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-semibold text-slate-900">Business Plans (Monthly Subscription)</h4>
                      <p className="text-sm text-slate-600">Reduce Returns. Increase Conversions. Let customers try before they buy.</p>
                      <div className="space-y-4 text-sm text-slate-600">
                        <div className="border rounded-lg p-4 bg-slate-50">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-semibold">Boutique Starter – R385 / month</span>
                          </div>
                          <ul className="space-y-1 text-xs">
                            <li>• 100 Virtual Try-Ons</li>
                            <li>• Widget integration</li>
                            <li>• Social media landing page</li>
                            <li>• Basic dashboard access</li>
                            <li>• Effective rate: R3.85 per simulation</li>
                          </ul>
                        </div>
                        <div className="border rounded-lg p-4 bg-slate-50">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-semibold">Boutique Growth – R750 / month</span>
                          </div>
                          <ul className="space-y-1 text-xs">
                            <li>• 200 Virtual Try-Ons</li>
                            <li>• Widget + API access</li>
                            <li>• Social media landing page</li>
                            <li>• Usage analytics</li>
                            <li>• Effective rate: R3.75 per simulation</li>
                          </ul>
                        </div>
                        <div className="border rounded-lg p-4 bg-slate-50">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-semibold">Store Pro – R1,350 / month</span>
                          </div>
                          <ul className="space-y-1 text-xs">
                            <li>• 500 Virtual Try-Ons</li>
                            <li>• Full API access/widget integration</li>
                            <li>• Branded try-on experience</li>
                            <li>• Conversion tracking</li>
                            <li>• Effective rate: R2.70 per simulation</li>
                          </ul>
                        </div>
                        <div className="border rounded-lg p-4 bg-slate-50">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-semibold">Store Scale – R2,200 / month</span>
                          </div>
                          <ul className="space-y-1 text-xs">
                            <li>• 1,000 Virtual Try-Ons</li>
                            <li>• Advanced analytics</li>
                            <li>• Full API access</li>
                            <li>• Priority support</li>
                            <li>• Branded try-on experience</li>
                            <li>• Lower per-use rate</li>
                            <li>• Effective rate: R2.20 per simulation</li>
                          </ul>
                        </div>
                        <div className="border rounded-lg p-4 bg-slate-50">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-semibold">Retailer Pro – R6,250 / month</span>
                          </div>
                          <ul className="space-y-1 text-xs">
                            <li>• 5,000 Virtual Try-Ons</li>
                            <li>• API + Custom integration</li>
                            <li>• Dedicated onboarding</li>
                            <li>• Performance reporting</li>
                            <li>• White label option</li>
                            <li>• Effective rate: R1.25 per simulation</li>
                          </ul>
                        </div>
                        <div className="border rounded-lg p-4 bg-slate-50">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-semibold">Enterprise Retail – R18,600 / month</span>
                          </div>
                          <ul className="space-y-1 text-xs">
                            <li>• 20,000 Virtual Try-Ons</li>
                            <li>• Full API integration</li>
                            <li>• White-label option</li>
                            <li>• Dedicated support</li>
                            <li>• Custom SLA</li>
                            <li>• Effective rate: R0.93 per simulation</li>
                          </ul>
                        </div>
                        <div className="border-t pt-4 mt-4">
                          <p className="text-xs font-semibold">Additional simulations billed at plan rate.</p>
                          <p className="text-xs font-semibold mt-2">Seamless integration via widget, API, or social selling landing page.</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t pt-4 space-y-2">
                      <h4 className="font-semibold text-slate-900">Purchase Credits via Yoco</h4>
                      <p className="text-sm text-slate-600">Initiate a credit purchase for your account</p>
                      <p className="font-mono text-sm bg-slate-100 p-3 rounded">POST /billing/initiatePurchase</p>
                      <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-auto relative group">
                        <pre>{`{
  "packageId": "pkg_100_credits",
  "quantity": 1
}`}</pre>
                        <button
                          onClick={() => copyToClipboard('{\n  "packageId": "pkg_100_credits",\n  "quantity": 1\n}', "req2")}
                          className="absolute top-2 right-2 p-2 bg-slate-700 hover:bg-slate-600 rounded opacity-0 group-hover:opacity-100 transition"
                        >
                          {copiedCode === "req2" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 p-4 rounded text-sm text-slate-600">
                      <p><strong>Note:</strong> All credits are valid for 30 days from purchase. Credits are non-refundable once purchased. Additional simulations billed at plan rate.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Webhooks */}
            <section id="webhooks" className="scroll-mt-20">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Webhooks</h2>
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <p className="text-slate-600">StyleSwap sends webhook events for important actions. Configure your webhook URL in the Developer Portal.</p>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-900">Event Types</h4>
                    <ul className="space-y-2 text-slate-600">
                      <li className="flex items-start gap-2">
                        <span className="text-orange-600 font-bold">•</span>
                        <span><strong>tryon.completed</strong> - Virtual try-on is ready</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-orange-600 font-bold">•</span>
                        <span><strong>tryon.failed</strong> - Try-on generation failed</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-orange-600 font-bold">•</span>
                        <span><strong>credit.purchased</strong> - Credits were purchased</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-orange-600 font-bold">•</span>
                        <span><strong>credit.expired</strong> - Credits have expired</span>
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-slate-900">Webhook Payload Example</h4>
                    <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-auto relative group">
                      <pre>{`{
  "event": "tryon.completed",
  "timestamp": "2026-02-11T10:31:45Z",
  "data": {
    "id": "tryon_123abc",
    "resultUrl": "https://cdn.styleswap.com/results/...",
    "processingTime": 105
  }
}`}</pre>
                      <button
                        onClick={() => copyToClipboard('{\n  "event": "tryon.completed",\n  "timestamp": "2026-02-11T10:31:45Z",\n  "data": {\n    "id": "tryon_123abc",\n    "resultUrl": "https://cdn.styleswap.com/results/...",\n    "processingTime": 105\n  }\n}', "webhook")}
                        className="absolute top-2 right-2 p-2 bg-slate-700 hover:bg-slate-600 rounded opacity-0 group-hover:opacity-100 transition"
                      >
                        {copiedCode === "webhook" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Error Handling */}
            <section id="errors" className="scroll-mt-20">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Error Handling</h2>
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <p className="text-slate-600">The API returns standard HTTP status codes. Errors include a detailed error message:</p>
                  
                  <div className="space-y-3">
                    <div className="border-l-4 border-red-500 pl-4 py-2">
                      <p className="font-semibold text-slate-900">400 Bad Request</p>
                      <p className="text-sm text-slate-600">Invalid request parameters</p>
                    </div>
                    <div className="border-l-4 border-red-500 pl-4 py-2">
                      <p className="font-semibold text-slate-900">401 Unauthorized</p>
                      <p className="text-sm text-slate-600">Invalid or missing API key</p>
                    </div>
                    <div className="border-l-4 border-red-500 pl-4 py-2">
                      <p className="font-semibold text-slate-900">429 Too Many Requests</p>
                      <p className="text-sm text-slate-600">Rate limit exceeded</p>
                    </div>
                    <div className="border-l-4 border-red-500 pl-4 py-2">
                      <p className="font-semibold text-slate-900">500 Internal Server Error</p>
                      <p className="text-sm text-slate-600">Server error - please retry</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* CTA */}
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white p-8 rounded-lg">
              <h3 className="text-xl font-bold mb-2">Ready to Integrate?</h3>
              <p className="text-orange-100 mb-4">Start building with StyleSwap API today. Purchase credits via Yoco to get started.</p>
              <div className="flex gap-4 flex-wrap">
                <a href="/pricing">
                  <Button className="bg-white text-orange-600 hover:bg-orange-50 font-semibold">
                    View Pricing <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </a>
                <a href="/register-app">
                  <Button className="bg-orange-500 text-white hover:bg-orange-400 font-semibold">
                    Register Your App <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
