import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Eye, EyeOff, RefreshCw, Toggle2 } from "lucide-react";
import { toast } from "sonner";

export default function DeveloperDashboard() {
  const [apiKey, setApiKey] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch app details
  const appQuery = trpc.developerDashboard.getAppByKey.useQuery(
    { apiKey },
    { enabled: !!apiKey }
  );

  // Fetch usage stats
  const statsQuery = trpc.developerDashboard.getUsageStats.useQuery(
    { apiKey },
    { enabled: !!apiKey }
  );

  // Fetch rate limits
  const rateLimitsQuery = trpc.developerDashboard.getRateLimits.useQuery(
    { apiKey },
    { enabled: !!apiKey }
  );

  // Fetch webhook config
  const webhookConfigQuery = trpc.developerDashboard.getWebhookConfig.useQuery(
    { apiKey },
    { enabled: !!apiKey }
  );

  // Regenerate secret mutation
  const regenerateSecretMutation = trpc.developerDashboard.regenerateApiSecret.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success("API secret regenerated successfully!");
        toast.info("New secret: " + data.newSecret);
      } else {
        toast.error(data.error || "Failed to regenerate secret");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Toggle live mode mutation
  const toggleLiveModeMutation = trpc.developerDashboard.toggleLiveMode.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.error || "Failed to toggle live mode");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleRegenerateSecret = async () => {
    if (!appQuery.data?.app) {
      toast.error("Please load your app first");
      return;
    }
    setIsLoading(true);
    try {
      await regenerateSecretMutation.mutateAsync({
        apiKey,
        currentSecret: appQuery.data.app.apiSecret || "",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleLiveMode = async (enable: boolean) => {
    setIsLoading(true);
    try {
      await toggleLiveModeMutation.mutateAsync({
        apiKey,
        enable,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Developer Dashboard</h1>
          <p className="text-muted-foreground">Manage your StyleSwap API integration</p>
        </div>

        {/* API Key Input */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Access Your Dashboard</CardTitle>
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
              <Button
                onClick={() => {
                  if (!apiKey) {
                    toast.error("Please enter your API key");
                  }
                }}
                disabled={!apiKey}
              >
                Load Dashboard
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Your API key is used only for authentication and is never stored.
            </p>
          </CardContent>
        </Card>

        {/* Loading State */}
        {appQuery.isLoading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        )}

        {/* Error State */}
        {appQuery.data?.success === false && (
          <Card className="border-red-200 bg-red-50 mb-8">
            <CardContent className="pt-6">
              <p className="text-red-800">{appQuery.data.error}</p>
            </CardContent>
          </Card>
        )}

        {/* Dashboard Content */}
        {appQuery.data?.success && appQuery.data.app && (
          <div className="space-y-6">
            {/* App Overview */}
            <Card>
              <CardHeader>
                <CardTitle>App Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">App Name</p>
                    <p className="font-semibold">{appQuery.data.app.appName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Company</p>
                    <p className="font-semibold">{appQuery.data.app.companyName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Platform Type</p>
                    <p className="font-semibold capitalize">{appQuery.data.app.platformType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-semibold">
                      <span
                        className={`px-2 py-1 rounded text-sm ${
                          appQuery.data.app.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {appQuery.data.app.status}
                      </span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="credentials" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="credentials">Credentials</TabsTrigger>
                <TabsTrigger value="usage">Usage</TabsTrigger>
                <TabsTrigger value="limits">Rate Limits</TabsTrigger>
                <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
              </TabsList>

              {/* Credentials Tab */}
              <TabsContent value="credentials">
                <Card>
                  <CardHeader>
                    <CardTitle>API Credentials</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">API Key</label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          type="text"
                          value={apiKey}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => copyToClipboard(apiKey, "API Key")}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium">API Secret</label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          type={showSecret ? "text" : "password"}
                          value={appQuery.data.app.apiSecret || "••••••••"}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => setShowSecret(!showSecret)}
                        >
                          {showSecret ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() =>
                            copyToClipboard(
                              appQuery.data?.app?.apiSecret || "",
                              "API Secret"
                            )
                          }
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
                      <p className="text-sm text-yellow-800">
                        <strong>⚠️ Important:</strong> Never share your API secret. If
                        compromised, regenerate it immediately.
                      </p>
                    </div>

                    <Button
                      onClick={handleRegenerateSecret}
                      disabled={isLoading}
                      variant="destructive"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerate Secret
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Usage Tab */}
              <TabsContent value="usage">
                <Card>
                  <CardHeader>
                    <CardTitle>API Usage Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {statsQuery.data?.success && (
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-blue-50 p-4 rounded">
                          <p className="text-sm text-muted-foreground">Total Requests</p>
                          <p className="text-3xl font-bold text-blue-600">
                            {statsQuery.data.stats.totalRequests}
                          </p>
                        </div>
                        <div className="bg-green-50 p-4 rounded">
                          <p className="text-sm text-muted-foreground">Days Active</p>
                          <p className="text-3xl font-bold text-green-600">
                            {statsQuery.data.stats.daysSinceRegistration}
                          </p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded">
                          <p className="text-sm text-muted-foreground">Avg Requests/Day</p>
                          <p className="text-3xl font-bold text-purple-600">
                            {statsQuery.data.stats.avgRequestsPerDay}
                          </p>
                        </div>
                        <div className="bg-orange-50 p-4 rounded">
                          <p className="text-sm text-muted-foreground">Last Request</p>
                          <p className="text-sm font-mono">
                            {statsQuery.data.stats.lastRequestAt
                              ? new Date(statsQuery.data.stats.lastRequestAt).toLocaleString()
                              : "Never"}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Rate Limits Tab */}
              <TabsContent value="limits">
                <Card>
                  <CardHeader>
                    <CardTitle>Rate Limits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {rateLimitsQuery.data?.success && (
                      <div className="space-y-4">
                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="border rounded p-4">
                            <p className="text-sm text-muted-foreground">Per Minute</p>
                            <p className="text-2xl font-bold">
                              {rateLimitsQuery.data.rateLimits.requestsPerMinute}
                            </p>
                          </div>
                          <div className="border rounded p-4">
                            <p className="text-sm text-muted-foreground">Per Hour</p>
                            <p className="text-2xl font-bold">
                              {rateLimitsQuery.data.rateLimits.requestsPerHour}
                            </p>
                          </div>
                          <div className="border rounded p-4">
                            <p className="text-sm text-muted-foreground">Per Day</p>
                            <p className="text-2xl font-bold">
                              {rateLimitsQuery.data.rateLimits.requestsPerDay}
                            </p>
                          </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 p-4 rounded">
                          <p className="text-sm text-blue-800">
                            <strong>ℹ️ Note:</strong> Rate limits are based on your app status.
                            Contact support to increase limits for production use.
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Webhooks Tab */}
              <TabsContent value="webhooks">
                <Card>
                  <CardHeader>
                    <CardTitle>Webhook Configuration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {webhookConfigQuery.data?.success && (
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold mb-3">Available Events</h3>
                          <div className="space-y-2">
                            {webhookConfigQuery.data.webhookConfig.events.map((event) => (
                              <div key={event.name} className="border rounded p-3">
                                <p className="font-mono text-sm font-semibold">{event.name}</p>
                                <p className="text-sm text-muted-foreground">{event.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-3">Retry Policy</h3>
                          <div className="border rounded p-3 space-y-2">
                            <p className="text-sm">
                              <span className="text-muted-foreground">Max Retries:</span>{" "}
                              <span className="font-semibold">
                                {webhookConfigQuery.data.webhookConfig.retryPolicy.maxRetries}
                              </span>
                            </p>
                            <p className="text-sm">
                              <span className="text-muted-foreground">Retry Delay:</span>{" "}
                              <span className="font-semibold">
                                {webhookConfigQuery.data.webhookConfig.retryPolicy.retryDelay}s
                              </span>
                            </p>
                          </div>
                        </div>

                        <Button className="w-full">Configure Webhooks</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Live Mode Toggle */}
            <Card>
              <CardHeader>
                <CardTitle>Environment Mode</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">
                      {appQuery.data.app.isLiveMode ? "Live Mode" : "Sandbox Mode"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {appQuery.data.app.isLiveMode
                        ? "Your app is in production"
                        : "Your app is in sandbox/testing mode"}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleToggleLiveMode(!appQuery.data.app.isLiveMode)}
                    disabled={isLoading}
                    variant={appQuery.data.app.isLiveMode ? "destructive" : "default"}
                  >
                    <Toggle2 className="w-4 h-4 mr-2" />
                    {appQuery.data.app.isLiveMode ? "Disable" : "Enable"} Live Mode
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
