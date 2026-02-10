import { useState } from "react";
import { useRoute } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, Copy, Check, Trash2, Plus, Eye, EyeOff, AlertCircle, Key } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  maskedKey: string;
  createdAt: Date;
  lastUsedAt?: Date;
  requestsCount: number;
  status: "active" | "revoked";
}

export default function BoutiqueApiKeys() {
  const [, params] = useRoute("/boutique-api-keys/:boutiqueId");
  const boutiqueId = params?.boutiqueId ? parseInt(params.boutiqueId) : null;
  
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [revealedKeyId, setRevealedKeyId] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<ApiKey | null>(null);

  // Fetch API keys
  const { data: apiKeys, isLoading: keysLoading, refetch } = trpc.boutiques.getApiKeys.useQuery(
    { boutiqueId: boutiqueId || 0 },
    { enabled: !!boutiqueId }
  );

  // Create API key mutation
  const createKeyMutation = trpc.boutiques.createApiKey.useMutation({
    onSuccess: () => {
      setNewKeyName("");
      setShowNewKeyModal(false);
      refetch();
    },
  });

  // Revoke API key mutation
  const revokeKeyMutation = trpc.boutiques.revokeApiKey.useMutation({
    onSuccess: () => {
      setSelectedKey(null);
      refetch();
    },
  });

  const handleCreateKey = async () => {
    if (!newKeyName.trim() || !boutiqueId) return;
    await createKeyMutation.mutateAsync({
      boutiqueId,
      name: newKeyName,
    });
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to revoke this API key? This action cannot be undone.")) return;
    await revokeKeyMutation.mutateAsync({ keyId });
  };

  const handleCopyKey = (key: string, keyId: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyId(keyId);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  if (!boutiqueId || keysLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">API Keys</h1>
            <p className="text-muted-foreground mt-2">
              Manage API keys for integrating StyleSwap with your systems
            </p>
          </div>
          <Button onClick={() => setShowNewKeyModal(true)} className="cursor-pointer">
            <Plus className="w-4 h-4 mr-2" />
            Generate New Key
          </Button>
        </div>

        {/* Info Card */}
        <Card className="premium-card border-primary/30 bg-primary/5">
          <CardContent className="pt-6 flex items-start gap-4">
            <Key className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold mb-2">API Key Security</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Keep your API keys secret and never share them</li>
                <li>• Regenerate keys periodically for security</li>
                <li>• Revoke keys immediately if compromised</li>
                <li>• Use different keys for different environments</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Create New Key Modal */}
        {showNewKeyModal && (
          <Card className="premium-card border-primary/30">
            <CardHeader>
              <CardTitle>Generate New API Key</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Key Name</label>
                <input
                  type="text"
                  placeholder="e.g., Production, Staging, Testing"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Give your key a descriptive name to remember its purpose
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateKey}
                  disabled={!newKeyName.trim() || createKeyMutation.isPending}
                  className="cursor-pointer"
                >
                  {createKeyMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Generate Key
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowNewKeyModal(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* API Keys List */}
        {apiKeys && apiKeys.length > 0 ? (
          <div className="space-y-4">
            {apiKeys.map((apiKey) => (
              <Card key={apiKey.id} className="premium-card">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Key Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-lg">{apiKey.name}</h3>
                          <Badge variant={apiKey.status === "active" ? "default" : "destructive"}>
                            {apiKey.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Created {formatDistanceToNow(new Date(apiKey.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      {apiKey.status === "active" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRevokeKey(apiKey.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    {/* Key Display */}
                    {apiKey.status === "active" && (
                      <div className="bg-muted/50 p-4 rounded-lg border border-border">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-muted-foreground">API KEY</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-xs font-mono break-all">
                            {revealedKeyId === apiKey.id ? apiKey.key : apiKey.maskedKey}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setRevealedKeyId(revealedKeyId === apiKey.id ? null : apiKey.id)
                            }
                            className="cursor-pointer"
                          >
                            {revealedKeyId === apiKey.id ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyKey(apiKey.key, apiKey.id)}
                            className="cursor-pointer"
                          >
                            {copiedKeyId === apiKey.id ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Requests</p>
                        <p className="text-lg font-bold">{apiKey.requestsCount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Last Used</p>
                        <p className="text-sm">
                          {apiKey.lastUsedAt
                            ? formatDistanceToNow(new Date(apiKey.lastUsedAt), { addSuffix: true })
                            : "Never"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="premium-card">
            <CardContent className="pt-12 text-center space-y-6">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                <Key className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">No API Keys Yet</h2>
                <p className="text-muted-foreground max-w-md mx-auto mb-4">
                  Generate your first API key to start integrating StyleSwap with your systems
                </p>
              </div>
              <Button onClick={() => setShowNewKeyModal(true)} className="cursor-pointer">
                <Plus className="w-4 h-4 mr-2" />
                Generate First Key
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Usage Documentation */}
        <Card className="premium-card">
          <CardHeader>
            <CardTitle>How to Use Your API Key</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Authentication</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Include your API key in the Authorization header of every request:
              </p>
              <div className="bg-muted/50 p-3 rounded border border-border">
                <code className="text-xs font-mono">
                  Authorization: Bearer sk_your_api_key_here
                </code>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Example Request</h4>
              <div className="bg-muted/50 p-3 rounded border border-border overflow-x-auto">
                <code className="text-xs font-mono whitespace-pre">{`curl -X GET https://api.styleswap.co.za/v1/tryons \\
  -H "Authorization: Bearer sk_your_api_key_here" \\
  -H "Content-Type: application/json"`}</code>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Rate Limits</h4>
              <p className="text-sm text-muted-foreground">
                Your API key is rate limited to 100 requests per minute. Contact support for higher limits.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
