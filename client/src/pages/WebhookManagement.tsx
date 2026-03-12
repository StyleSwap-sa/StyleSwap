import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Play, Copy, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

export default function WebhookManagement() {
  const [apiKey, setApiKey] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch webhooks
  const webhooksQuery = trpc.webhooks.getWebhooks.useQuery(
    { apiKey },
    { enabled: !!apiKey }
  );

  // Fetch valid events
  const eventsQuery = trpc.webhooks.getValidEvents.useQuery();

  // Create webhook mutation
  const createWebhookMutation = trpc.webhooks.createWebhook.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Webhook created successfully!");
        setWebhookUrl("");
        setSelectedEvents([]);
        setIsDialogOpen(false);
        webhooksQuery.refetch();
      } else {
        toast.error(data.error || "Failed to create webhook");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Delete webhook mutation
  const deleteWebhookMutation = trpc.webhooks.deleteWebhook.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Webhook deleted successfully!");
        webhooksQuery.refetch();
      } else {
        toast.error(data.error || "Failed to delete webhook");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Test webhook mutation
  const testWebhookMutation = trpc.webhooks.testWebhook.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Test successful! Status: ${data.statusCode}, Response time: ${data.responseTime}ms`);
      } else {
        toast.error(`Test failed: ${data.error}`);
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleLoadWebhooks = () => {
    if (!apiKey) {
      toast.error("Please enter your API key");
      return;
    }
  };

  const handleCreateWebhook = async () => {
    if (!apiKey) {
      toast.error("Please enter your API key");
      return;
    }
    if (!webhookUrl) {
      toast.error("Please enter a webhook URL");
      return;
    }
    if (selectedEvents.length === 0) {
      toast.error("Please select at least one event");
      return;
    }

    await createWebhookMutation.mutateAsync({
      apiKey,
      url: webhookUrl,
      events: selectedEvents,
    });
  };

  const handleDeleteWebhook = async (webhookId: number) => {
    if (!confirm("Are you sure you want to delete this webhook?")) return;
    await deleteWebhookMutation.mutateAsync({
      apiKey,
      webhookId,
    });
  };

  const handleTestWebhook = async (webhookId: number) => {
    await testWebhookMutation.mutateAsync({
      apiKey,
      webhookId,
    });
  };

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Webhook Management</h1>
          <p className="text-muted-foreground">Configure and manage webhooks for your StyleSwap integration</p>
        </div>

        {/* API Key Input */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Access Webhooks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="Enter your API Key (sk_...)"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleLoadWebhooks} disabled={!apiKey}>
                Load Webhooks
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {webhooksQuery.isLoading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading webhooks...</p>
          </div>
        )}

        {/* Error State */}
        {webhooksQuery.data?.success === false && (
          <Card className="border-red-200 bg-red-50 mb-8">
            <CardContent className="pt-6 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-800">{webhooksQuery.data.error}</p>
            </CardContent>
          </Card>
        )}

        {/* Webhooks Content */}
        {webhooksQuery.data?.success && (
          <div className="space-y-6">
            {/* Create Webhook Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Webhooks</h2>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Webhook
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Webhook</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* Webhook URL */}
                    <div>
                      <label className="text-sm font-medium">Webhook URL</label>
                      <Input
                        type="url"
                        placeholder="https://your-domain.com/webhooks/styleswap"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Must be HTTPS and publicly accessible
                      </p>
                    </div>

                    {/* Events Selection */}
                    <div>
                      <label className="text-sm font-medium mb-3 block">Subscribe to Events</label>
                      <div className="space-y-2">
                        {eventsQuery.data?.events.map((event) => (
                          <label key={event.name} className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={selectedEvents.includes(event.name)}
                              onCheckedChange={() => toggleEvent(event.name)}
                            />
                            <div>
                              <p className="font-mono text-sm">{event.name}</p>
                              <p className="text-xs text-muted-foreground">{event.description}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Create Button */}
                    <Button
                      onClick={handleCreateWebhook}
                      disabled={createWebhookMutation.isPending}
                      className="w-full"
                    >
                      {createWebhookMutation.isPending ? "Creating..." : "Create Webhook"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Webhooks List */}
            {webhooksQuery.data.webhooks.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="pt-12 pb-12 text-center">
                  <p className="text-lg font-semibold mb-2">No webhooks configured</p>
                  <p className="text-sm text-muted-foreground">
                    Create your first webhook to start receiving real-time events
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {webhooksQuery.data.webhooks.map((webhook: any) => (
                  <Card key={webhook.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="font-mono text-sm">{webhook.url}</CardTitle>
                          <p className="text-xs text-muted-foreground mt-1">
                            {webhook.isActive ? (
                              <span className="flex items-center gap-1 text-green-600">
                                <CheckCircle2 className="w-3 h-3" /> Active
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-gray-600">
                                <Clock className="w-3 h-3" /> Inactive
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleTestWebhook(webhook.id)}
                            disabled={testWebhookMutation.isPending}
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Test
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteWebhook(webhook.id)}
                            disabled={deleteWebhookMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Events */}
                      <div>
                        <p className="text-sm font-medium mb-2">Subscribed Events</p>
                        <div className="flex flex-wrap gap-2">
                          {webhook.events.map((event: string) => (
                            <span key={event} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                              {event}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Retry Policy */}
                      <div className="bg-gray-50 p-3 rounded text-sm">
                        <p className="font-medium mb-2">Retry Policy</p>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <p className="text-muted-foreground">Max Retries</p>
                            <p className="font-semibold">{webhook.retryPolicy.maxRetries}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Retry Delay</p>
                            <p className="font-semibold">{webhook.retryPolicy.retryDelay}s</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Backoff</p>
                            <p className="font-semibold">{webhook.retryPolicy.backoffMultiplier}x</p>
                          </div>
                        </div>
                      </div>

                      {/* Timestamps */}
                      <div className="text-xs text-muted-foreground">
                        <p>Created: {new Date(webhook.createdAt).toLocaleString()}</p>
                        <p>Updated: {new Date(webhook.updatedAt).toLocaleString()}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Documentation Section */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle>Webhook Documentation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Webhook Signature Verification</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Each webhook request includes an <code className="bg-white px-1 rounded">X-Webhook-Signature</code> header
                containing an HMAC-SHA256 signature. Verify this signature using your webhook secret:
              </p>
              <pre className="bg-white p-3 rounded text-xs overflow-auto">
                {`const crypto = require('crypto');
const signature = req.headers['x-webhook-signature'];
const payload = req.body;
const secret = 'your-webhook-secret';

const hash = crypto
  .createHmac('sha256', secret)
  .update(JSON.stringify(payload))
  .digest('hex');

if (hash !== signature) {
  throw new Error('Invalid signature');
}`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Webhook Payload Format</h3>
              <pre className="bg-white p-3 rounded text-xs overflow-auto">
                {`{
  "id": 12345,
  "type": "tryon.completed",
  "data": {
    "appId": "app_123",
    "userId": "user_456",
    "tryonId": "tryon_789",
    "status": "completed",
    "imageUrl": "https://..."
  },
  "timestamp": "2026-03-12T14:30:00Z"
}`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
