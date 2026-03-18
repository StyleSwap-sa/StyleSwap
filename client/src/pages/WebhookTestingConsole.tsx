import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Send, Copy, Check, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export default function WebhookTestingConsole() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState('tryon.generated');
  const [webhookUrl, setWebhookUrl] = useState('https://yoursite.com/webhooks');
  const [testPayload, setTestPayload] = useState('{}');
  const [sendingTest, setSendingTest] = useState(false);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sendTestWebhook = async () => {
    setSendingTest(true);
    // Simulate sending webhook
    setTimeout(() => {
      setSendingTest(false);
    }, 2000);
  };

  const webhookEvents = [
    {
      name: 'tryon.generated',
      description: 'Fired when a try-on image is successfully generated',
      payload: {
        event: 'tryon.generated',
        timestamp: '2026-02-10T09:15:00Z',
        data: {
          tryonId: 'tryon_abc123',
          customerId: 'cust_123',
          productId: 'prod_456',
          imageUrl: 'https://cdn.styleswap.com/tryons/abc123.jpg',
          processingTime: 2.5,
        },
      },
    },
    {
      name: 'tryon.failed',
      description: 'Fired when try-on generation fails',
      payload: {
        event: 'tryon.failed',
        timestamp: '2026-02-10T09:16:00Z',
        data: {
          tryonId: 'tryon_def456',
          customerId: 'cust_123',
          productId: 'prod_456',
          error: 'Invalid body pose detected',
          errorCode: 'INVALID_POSE',
        },
      },
    },
    {
      name: 'credits.purchased',
      description: 'Fired when credits are purchased',
      payload: {
        event: 'credits.purchased',
        timestamp: '2026-02-10T09:17:00Z',
        data: {
          developerId: 'dev_789',
          packageId: 'pkg_50',
          credits: 50,
          amount: 150.00,
          currency: 'ZAR',
          transactionId: 'txn_xyz789',
        },
      },
    },
    {
      name: 'credits.depleted',
      description: 'Fired when credits are running low',
      payload: {
        event: 'credits.depleted',
        timestamp: '2026-02-10T09:18:00Z',
        data: {
          developerId: 'dev_789',
          remainingCredits: 5,
          threshold: 10,
        },
      },
    },
  ];

  const deliveryLogs = [
    {
      id: 'del_1',
      event: 'tryon.generated',
      timestamp: '2026-02-10T09:15:00Z',
      status: 'success',
      statusCode: 200,
      responseTime: 145,
    },
    {
      id: 'del_2',
      event: 'tryon.generated',
      timestamp: '2026-02-10T09:14:00Z',
      status: 'success',
      statusCode: 200,
      responseTime: 128,
    },
    {
      id: 'del_3',
      event: 'credits.purchased',
      timestamp: '2026-02-10T09:13:00Z',
      status: 'failed',
      statusCode: 500,
      responseTime: 5000,
      error: 'Internal Server Error',
    },
    {
      id: 'del_4',
      event: 'tryon.failed',
      timestamp: '2026-02-10T09:12:00Z',
      status: 'success',
      statusCode: 200,
      responseTime: 156,
    },
    {
      id: 'del_5',
      event: 'credits.depleted',
      timestamp: '2026-02-10T09:11:00Z',
      status: 'pending',
      statusCode: null,
      responseTime: null,
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/5">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Webhook Testing Console</h1>
          <p className="text-lg text-primary-foreground/90 max-w-2xl">
            Test webhook deliveries, view payloads, and debug integration issues in real-time.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <Tabs defaultValue="test" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="test">Test Webhook</TabsTrigger>
            <TabsTrigger value="logs">Delivery Logs</TabsTrigger>
          </TabsList>

          {/* Test Webhook Tab */}
          <TabsContent value="test" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Webhook Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Webhook URL</label>
                    <input
                      type="url"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://yoursite.com/webhooks"
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Enter your webhook endpoint URL to receive test events
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Event Type</label>
                    <select
                      value={selectedEvent}
                      onChange={(e) => setSelectedEvent(e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                    >
                      {webhookEvents.map((event) => (
                        <option key={event.name} value={event.name}>
                          {event.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button
                    onClick={sendTestWebhook}
                    disabled={sendingTest}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {sendingTest ? 'Sending...' : 'Send Test Webhook'}
                  </Button>
                </CardContent>
              </Card>

              {/* Payload Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Payload Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {webhookEvents.find((e) => e.name === selectedEvent) && (
                    <>
                      <p className="text-sm text-muted-foreground">
                        {webhookEvents.find((e) => e.name === selectedEvent)?.description}
                      </p>
                      <div className="bg-muted p-4 rounded-lg overflow-x-auto max-h-64 overflow-y-auto">
                        <pre className="text-xs font-mono">
                          {JSON.stringify(
                            webhookEvents.find((e) => e.name === selectedEvent)?.payload,
                            null,
                            2
                          )}
                        </pre>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(
                            JSON.stringify(
                              webhookEvents.find((e) => e.name === selectedEvent)?.payload,
                              null,
                              2
                            ),
                            'payload'
                          )
                        }
                        className="w-full"
                      >
                        {copiedId === 'payload' ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Payload
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* All Events */}
            <Card>
              <CardHeader>
                <CardTitle>Available Webhook Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {webhookEvents.map((event) => (
                    <div
                      key={event.name}
                      className="border border-border rounded-lg p-4 hover:bg-muted/50 transition cursor-pointer"
                      onClick={() => setSelectedEvent(event.name)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">{event.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(event.name);
                          }}
                        >
                          Test
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Delivery Logs Tab */}
          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Webhook Deliveries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deliveryLogs.map((log) => (
                    <div
                      key={log.id}
                      className="border border-border rounded-lg p-4 hover:bg-muted/50 transition"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(log.status)}
                          <div>
                            <p className="font-semibold text-sm">{log.event}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(log.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(log.status)}
                          {log.statusCode && (
                            <span className="text-xs font-mono text-muted-foreground">
                              {log.statusCode}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        {log.responseTime && (
                          <div>
                            <p className="text-muted-foreground">Response Time</p>
                            <p className="font-semibold">{log.responseTime}ms</p>
                          </div>
                        )}
                        {log.error && (
                          <div className="col-span-2">
                            <p className="text-muted-foreground">Error</p>
                            <p className="font-semibold text-red-600">{log.error}</p>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-3 border-t border-border flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(log.id, log.id)}
                        >
                          {copiedId === log.id ? (
                            <>
                              <Check className="w-3 h-3 mr-1" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 mr-1" />
                              Copy ID
                            </>
                          )}
                        </Button>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        {log.status === 'failed' && (
                          <Button variant="outline" size="sm">
                            Retry
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">1,250</p>
                  <p className="text-xs text-muted-foreground">Last 30 days</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">98.5%</p>
                  <p className="text-xs text-muted-foreground">19 failures</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">245ms</p>
                  <p className="text-xs text-muted-foreground">Median: 180ms</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Pending Retries</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">3</p>
                  <p className="text-xs text-muted-foreground">Next retry in 5m</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
