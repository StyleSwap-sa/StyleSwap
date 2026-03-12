import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Code2, BookOpen, Zap, Shield, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

export default function APIDocumentation() {
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [selectedEndpoint, setSelectedEndpoint] = useState(0);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  // Fetch all data
  const endpointsQuery = trpc.apiDocs.getEndpoints.useQuery();
  const guidesQuery = trpc.apiDocs.getAllGuides.useQuery();
  const codeExamplesQuery = trpc.apiDocs.getCodeExamples.useQuery({ language: selectedLanguage });
  const quickStartQuery = trpc.apiDocs.getQuickStart.useQuery();
  const pricingQuery = trpc.apiDocs.getPricing.useQuery();
  const faqQuery = trpc.apiDocs.getFAQ.useQuery();
  const summaryQuery = trpc.apiDocs.getReferenceSummary.useQuery();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const currentEndpoint = endpointsQuery.data?.endpoints[selectedEndpoint];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
        <div className="max-w-6xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-2">API Documentation</h1>
          <p className="text-blue-100">
            Complete guide to integrating StyleSwap virtual try-on into your application
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <Tabs defaultValue="reference" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="reference">Reference</TabsTrigger>
            <TabsTrigger value="guides">Guides</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>

          {/* Reference Tab */}
          <TabsContent value="reference" className="space-y-6">
            {/* Quick Stats */}
            {summaryQuery.data?.success && (
              <div className="grid md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Total Endpoints</p>
                    <p className="text-3xl font-bold">{summaryQuery.data.summary.totalEndpoints}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Base URL</p>
                    <p className="text-sm font-mono">{summaryQuery.data.summary.baseUrl}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Auth Method</p>
                    <p className="text-sm font-semibold">Bearer Token</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Content Type</p>
                    <p className="text-sm font-mono">application/json</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Endpoints List and Details */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Endpoints List */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Endpoints</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {endpointsQuery.data?.endpoints.map((endpoint, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedEndpoint(idx)}
                        className={`w-full text-left p-3 rounded text-sm transition ${
                          selectedEndpoint === idx
                            ? "bg-blue-100 text-blue-900 border-l-4 border-blue-600"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        <span className="font-mono text-xs font-bold">{endpoint.method}</span>
                        <p className="font-mono text-xs mt-1 truncate">{endpoint.path}</p>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Endpoint Details */}
              <div className="lg:col-span-2 space-y-4">
                {currentEndpoint && (
                  <>
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>{currentEndpoint.title}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              {currentEndpoint.description}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded font-mono text-sm font-bold text-white ${
                            currentEndpoint.method === "GET"
                              ? "bg-blue-600"
                              : currentEndpoint.method === "POST"
                              ? "bg-green-600"
                              : currentEndpoint.method === "PUT"
                              ? "bg-yellow-600"
                              : "bg-red-600"
                          }`}>
                            {currentEndpoint.method}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Path */}
                        <div>
                          <p className="font-semibold text-sm mb-2">Endpoint</p>
                          <div className="bg-gray-100 p-3 rounded font-mono text-sm flex justify-between items-center">
                            <span>{currentEndpoint.path}</span>
                            <button
                              onClick={() => copyToClipboard(currentEndpoint.path)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Parameters */}
                        {currentEndpoint.parameters && currentEndpoint.parameters.length > 0 && (
                          <div>
                            <p className="font-semibold text-sm mb-2">Parameters</p>
                            <div className="space-y-2">
                              {currentEndpoint.parameters.map((param, idx) => (
                                <div key={idx} className="border rounded p-3">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="font-mono text-sm">{param.name}</p>
                                      <p className="text-xs text-muted-foreground">{param.type}</p>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded ${
                                      param.required
                                        ? "bg-red-100 text-red-800"
                                        : "bg-gray-100 text-gray-800"
                                    }`}>
                                      {param.required ? "Required" : "Optional"}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-2">{param.description}</p>
                                  {param.example && (
                                    <p className="text-xs font-mono mt-2 text-gray-600">
                                      Example: {param.example}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Request Body */}
                        {currentEndpoint.requestBody && (
                          <div>
                            <p className="font-semibold text-sm mb-2">Request Body</p>
                            <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                              {JSON.stringify(currentEndpoint.requestBody.example, null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* Response */}
                        <div>
                          <p className="font-semibold text-sm mb-2">Response</p>
                          <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                            {JSON.stringify(currentEndpoint.response.example, null, 2)}
                          </pre>
                        </div>

                        {/* Rate Limit */}
                        {currentEndpoint.rateLimit && (
                          <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                            <p className="font-semibold text-sm mb-2 flex items-center gap-2">
                              <Zap className="w-4 h-4" />
                              Rate Limits
                            </p>
                            <div className="grid grid-cols-3 gap-2 text-sm">
                              <div>
                                <p className="text-muted-foreground">Per Minute</p>
                                <p className="font-semibold">{currentEndpoint.rateLimit.requestsPerMinute}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Per Hour</p>
                                <p className="font-semibold">{currentEndpoint.rateLimit.requestsPerHour}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Per Day</p>
                                <p className="font-semibold">{currentEndpoint.rateLimit.requestsPerDay}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Guides Tab */}
          <TabsContent value="guides" className="space-y-6">
            {guidesQuery.data?.guides.map((guide: any) => (
              <Card key={guide.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    {guide.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" onClick={() => {
                    toast.info(`Loading ${guide.title}...`);
                  }}>
                    Read Guide
                  </Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Examples Tab */}
          <TabsContent value="examples" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Code Examples</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Language Selector */}
                <div className="flex gap-2">
                  {["javascript", "python", "curl"].map((lang) => (
                    <Button
                      key={lang}
                      variant={selectedLanguage === lang ? "default" : "outline"}
                      onClick={() => setSelectedLanguage(lang)}
                      className="capitalize"
                    >
                      {lang}
                    </Button>
                  ))}
                </div>

                {/* Code Example */}
                {codeExamplesQuery.data?.example && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-semibold text-sm">Create Try-On</p>
                      <button
                        onClick={() => copyToClipboard(codeExamplesQuery.data.example.code)}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </button>
                    </div>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-auto text-sm">
                      {codeExamplesQuery.data.example.code}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing" className="space-y-6">
            {pricingQuery.data?.success && (
              <>
                <div className="grid md:grid-cols-3 gap-4">
                  {pricingQuery.data.pricing.plans.map((plan: any, idx: number) => (
                    <Card key={idx} className={plan.contactSales ? "border-blue-500 border-2" : ""}>
                      <CardHeader>
                        <CardTitle>{plan.name}</CardTitle>
                        <p className="text-2xl font-bold mt-2">
                          {typeof plan.price === "string" ? plan.price : `R${plan.price}`}
                          <span className="text-sm text-muted-foreground">/month</span>
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2 text-sm">
                          <p>
                            <strong>Credits:</strong>{" "}
                            {typeof plan.features.creditsPerMonth === "string"
                              ? plan.features.creditsPerMonth
                              : `${plan.features.creditsPerMonth.toLocaleString()}/month`}
                          </p>
                          <p>
                            <strong>Requests/Min:</strong> {plan.features.requestsPerMinute}
                          </p>
                          <p>
                            <strong>Support:</strong> {plan.features.support}
                          </p>
                        </div>
                        {plan.contactSales ? (
                          <Button className="w-full">Contact Sales</Button>
                        ) : (
                          <Button className="w-full">Get Started</Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Credit Costs */}
                <Card>
                  <CardHeader>
                    <CardTitle>Credit Costs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(pricingQuery.data.pricing.creditCosts).map(([key, value]) => (
                        <div key={key} className="flex justify-between p-2 border-b">
                          <span className="capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                          <span className="font-semibold">{value} credits</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="space-y-4">
            {faqQuery.data?.faq.map((item: any, idx: number) => (
              <Card key={idx}>
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === idx ? null : idx)}
                  className="w-full text-left p-6 flex justify-between items-center hover:bg-gray-50"
                >
                  <p className="font-semibold flex items-center gap-2">
                    <HelpCircle className="w-5 h-5" />
                    {item.question}
                  </p>
                  <span className="text-2xl">{expandedFAQ === idx ? "−" : "+"}</span>
                </button>
                {expandedFAQ === idx && (
                  <CardContent className="border-t pt-4">
                    <Streamdown>{item.answer}</Streamdown>
                  </CardContent>
                )}
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* Quick Start Section */}
        {quickStartQuery.data?.success && (
          <Card className="mt-12 bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Quick Start Guide
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {quickStartQuery.data.quickStart.steps.map((step: any) => (
                  <div key={step.step} className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      {step.step}
                    </div>
                    <div>
                      <p className="font-semibold">{step.title}</p>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
