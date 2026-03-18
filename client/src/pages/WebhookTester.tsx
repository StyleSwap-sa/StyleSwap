import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check, Send, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export default function WebhookTester() {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [eventType, setEventType] = useState('tryon.generated');
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const eventTypes = [
    { value: 'tryon.generated', label: 'Try-On Generated', color: 'bg-green-100 text-green-800' },
    { value: 'tryon.failed', label: 'Try-On Failed', color: 'bg-red-100 text-red-800' },
    { value: 'customer.created', label: 'Customer Created', color: 'bg-blue-100 text-blue-800' },
    { value: 'payment.completed', label: 'Payment Completed', color: 'bg-purple-100 text-purple-800' },
  ];

  const getEventPayload = (type: string) => {
    const basePayload = {
      id: `evt_${Date.now()}`,
      type: type,
      timestamp: Math.floor(Date.now() / 1000),
    };

    switch (type) {
      case 'tryon.generated':
        return {
          ...basePayload,
          data: {
            tryOnId: `tryon_${Date.now()}`,
            apiKeyId: 'key_test_123',
            productId: 'prod_123',
            imageUrl: 'https://cdn.styleswap.com/tryons/test.jpg',
            processingTime: 2500,
          },
        };
      case 'tryon.failed':
        return {
          ...basePayload,
          data: {
            tryOnId: `tryon_${Date.now()}`,
            apiKeyId: 'key_test_123',
            error: 'Image processing failed',
            errorCode: 'PROCESSING_ERROR',
          },
        };
      case 'customer.created':
        return {
          ...basePayload,
          data: {
            customerId: `cust_${Date.now()}`,
            email: 'customer@example.com',
            name: 'Test Customer',
          },
        };
      case 'payment.completed':
        return {
          ...basePayload,
          data: {
            paymentId: `pay_${Date.now()}`,
            apiKeyId: 'key_test_123',
            amount: 385,
            currency: 'ZAR',
            credits: 100,
          },
        };
      default:
        return basePayload;
    }
  };

  const sendWebhook = async () => {
    if (!webhookUrl) {
      alert('Please enter a webhook URL');
      return;
    }

    setIsSending(true);
    const startTime = Date.now();
    const payload = getEventPayload(eventType);

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-StyleSwap-Signature': 'test_signature_' + Date.now(),
          'X-StyleSwap-Timestamp': Math.floor(Date.now() / 1000).toString(),
        },
        body: JSON.stringify(payload),
      });

      const duration = Date.now() - startTime;
      const result = {
        timestamp: new Date().toISOString(),
        eventType: eventType,
        url: webhookUrl,
        status: response.status,
        statusText: response.statusText,
        duration: duration,
        success: response.ok,
        payload: payload,
      };

      setTestResults([result, ...testResults.slice(0, 9)]);
    } catch (error) {
      const duration = Date.now() - startTime;
      const result = {
        timestamp: new Date().toISOString(),
        eventType: eventType,
        url: webhookUrl,
        status: 0,
        statusText: 'Connection Error',
        duration: duration,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        payload: payload,
      };

      setTestResults([result, ...testResults.slice(0, 9)]);
    } finally {
      setIsSending(false);
    }
  };

  const copyPayload = (payload: any) => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Webhook Tester</h1>
          <p className="text-slate-600">Test and validate your webhook endpoints before going live</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Test Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Webhook URL</label>
                  <Input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://your-domain.com/webhooks"
                    className="w-full"
                  />
                  <p className="text-xs text-slate-500 mt-1">Your endpoint must accept POST requests</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Event Type</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {eventTypes.map((evt) => (
                      <option key={evt.value} value={evt.value}>
                        {evt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  onClick={sendWebhook}
                  disabled={isSending}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSending ? 'Sending...' : 'Send Test Event'}
                </Button>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-900">
                    <strong>Tip:</strong> Your endpoint should respond with a 2xx status code within 30 seconds.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payload & Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payload Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Event Payload</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-x-auto max-h-64">
                  <pre>{JSON.stringify(getEventPayload(eventType), null, 2)}</pre>
                </div>
                <Button
                  variant="outline"
                  onClick={() => copyPayload(getEventPayload(eventType))}
                  className="w-full"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Payload
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Test Results */}
            <Card>
              <CardHeader>
                <CardTitle>Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                {testResults.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No test results yet. Send a test event to see results here.</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {testResults.map((result, idx) => (
                      <div key={idx} className="border border-slate-200 rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {result.success ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-red-600" />
                            )}
                            <div>
                              <p className="font-semibold text-sm">{result.eventType}</p>
                              <p className="text-xs text-slate-500">{result.timestamp}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                              {result.status} {result.statusText}
                            </p>
                            <p className="text-xs text-slate-500 flex items-center gap-1 justify-end">
                              <Clock className="w-3 h-3" />
                              {result.duration}ms
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 break-all">{result.url}</p>
                        {result.error && (
                          <p className="text-xs text-red-600 mt-2">Error: {result.error}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Documentation */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Webhook Integration Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="headers" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="headers">Headers</TabsTrigger>
                <TabsTrigger value="verification">Verification</TabsTrigger>
                <TabsTrigger value="best-practices">Best Practices</TabsTrigger>
              </TabsList>

              <TabsContent value="headers" className="space-y-4">
                <p className="text-sm text-slate-600">All webhook requests include these headers:</p>
                <div className="bg-slate-100 p-4 rounded-lg font-mono text-sm space-y-2">
                  <div><span className="text-blue-600">X-StyleSwap-Signature:</span> HMAC-SHA256 signature</div>
                  <div><span className="text-blue-600">X-StyleSwap-Timestamp:</span> Unix timestamp of event</div>
                  <div><span className="text-blue-600">Content-Type:</span> application/json</div>
                </div>
              </TabsContent>

              <TabsContent value="verification" className="space-y-4">
                <p className="text-sm text-slate-600">Verify webhook authenticity using the signature:</p>
                <div className="bg-slate-100 p-4 rounded-lg font-mono text-sm">
                  <pre>{`const crypto = require('crypto');
const signature = req.headers['x-styleswap-signature'];
const timestamp = req.headers['x-styleswap-timestamp'];
const body = req.rawBody; // Raw request body

const hash = crypto
  .createHmac('sha256', process.env.WEBHOOK_SECRET)
  .update(timestamp + '.' + body)
  .digest('hex');

if (hash === signature) {
  // Webhook is authentic
}`}</pre>
                </div>
              </TabsContent>

              <TabsContent value="best-practices" className="space-y-4">
                <ul className="space-y-2 text-sm">
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Respond with 2xx status code within 30 seconds</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Process webhooks asynchronously to avoid timeouts</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Verify webhook signatures for security</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Implement idempotency to handle duplicate events</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-600 font-bold">✓</span>
                    <span>Log all webhook events for debugging</span>
                  </li>
                </ul>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
