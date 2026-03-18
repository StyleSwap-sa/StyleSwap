import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Copy, Trash2, Edit2, Check, X, Eye, EyeOff, Key, AlertCircle } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function ApiKeyManagement() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("keys");
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyDescription, setNewKeyDescription] = useState("");
  const [editingKeyId, setEditingKeyId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [revealedKeyId, setRevealedKeyId] = useState<number | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<number | null>(null);

  // Get boutique ID from user (assuming user has a boutique association)
  const boutiqueId = user?.id || 0;

  // tRPC queries and mutations
  const { data: apiKeys, isLoading: keysLoading, refetch: refetchKeys } = trpc.apiKeys.getApiKeys.useQuery(
    { boutiqueId },
    { enabled: !!boutiqueId }
  );

  const createKeyMutation = trpc.apiKeys.createApiKey.useMutation({
    onSuccess: () => {
      setNewKeyName("");
      setNewKeyDescription("");
      setShowNewKeyDialog(false);
      refetchKeys();
    },
  });

  const updateKeyMutation = trpc.apiKeys.updateApiKeyName.useMutation({
    onSuccess: () => {
      setEditingKeyId(null);
      refetchKeys();
    },
  });

  const revokeKeyMutation = trpc.apiKeys.revokeApiKey.useMutation({
    onSuccess: () => {
      refetchKeys();
    },
  });

  const getStatsMutation = trpc.apiKeys.getApiKeyStats.useMutation();

  // Handlers
  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;
    
    try {
      await createKeyMutation.mutateAsync({
        boutiqueId,
        name: newKeyName,
        description: newKeyDescription,
      });
    } catch (error) {
      console.error("Failed to create API key:", error);
    }
  };

  const handleUpdateKeyName = async (keyId: number) => {
    if (!editingName.trim()) return;
    
    try {
      await updateKeyMutation.mutateAsync({
        keyId,
        name: editingName,
      });
    } catch (error) {
      console.error("Failed to update API key:", error);
    }
  };

  const handleRevokeKey = async (keyId: number) => {
    if (!confirm("Are you sure you want to revoke this API key? This action cannot be undone.")) {
      return;
    }

    try {
      await revokeKeyMutation.mutateAsync({ keyId });
    } catch (error) {
      console.error("Failed to revoke API key:", error);
    }
  };

  const handleCopyKey = (key: string, keyId: number) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyId(keyId);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleViewStats = async (keyId: number) => {
    try {
      const stats = await getStatsMutation.mutateAsync({ keyId });
      console.log("API Key Stats:", stats);
      // TODO: Show stats in a modal or separate view
    } catch (error) {
      console.error("Failed to get API key stats:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">API Key Management</h1>
              <p className="text-slate-600 mt-1">Generate and manage API keys for your boutique</p>
            </div>
            <Button 
              className="bg-orange-600 hover:bg-orange-700"
              onClick={() => setShowNewKeyDialog(true)}
            >
              <Key className="w-4 h-4 mr-2" />
              Generate New Key
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="keys">Active Keys</TabsTrigger>
            <TabsTrigger value="revoked">Revoked Keys</TabsTrigger>
          </TabsList>

          {/* Active Keys Tab */}
          <TabsContent value="keys" className="space-y-6">
            {/* Create New Key Dialog */}
            {showNewKeyDialog && (
              <Card className="border-2 border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle>Generate New API Key</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      Key Name
                    </label>
                    <Input
                      placeholder="e.g., Production, Testing, Development"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      Description (Optional)
                    </label>
                    <Input
                      placeholder="What will this key be used for?"
                      value={newKeyDescription}
                      onChange={(e) => setNewKeyDescription(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      className="flex-1 bg-orange-600 hover:bg-orange-700"
                      onClick={handleCreateKey}
                      disabled={createKeyMutation.isPending || !newKeyName.trim()}
                    >
                      {createKeyMutation.isPending ? "Creating..." : "Generate Key"}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowNewKeyDialog(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Keys List */}
            {keysLoading ? (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-slate-600">Loading API keys...</p>
                </CardContent>
              </Card>
            ) : apiKeys && apiKeys.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Your API Keys</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {apiKeys.map((key) => (
                      <div
                        key={key.id}
                        className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            {editingKeyId === key.id ? (
                              <div className="flex gap-2 mb-3">
                                <Input
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  className="flex-1"
                                  placeholder="Key name"
                                />
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleUpdateKeyName(key.id)}
                                  disabled={updateKeyMutation.isPending}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingKeyId(null)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <h3 className="font-semibold text-slate-900 mb-2">{key.name}</h3>
                            )}

                            {key.description && (
                              <p className="text-sm text-slate-600 mb-3">{key.description}</p>
                            )}

                            <div className="flex items-center gap-2 mb-3">
                              <code className="bg-slate-100 px-3 py-2 rounded text-sm font-mono text-slate-700 flex-1 truncate">
                                {revealedKeyId === key.id ? key.key : key.maskedKey}
                              </code>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setRevealedKeyId(revealedKeyId === key.id ? null : key.id)}
                              >
                                {revealedKeyId === key.id ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCopyKey(key.key, key.id)}
                              >
                                {copiedKeyId === key.id ? (
                                  <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-slate-600">
                              <span>Created: {new Date(key.createdAt).toLocaleDateString()}</span>
                              {key.lastUsedAt && (
                                <span>Last used: {new Date(key.lastUsedAt).toLocaleDateString()}</span>
                              )}
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                                Active
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            {editingKeyId !== key.id && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingKeyId(key.id);
                                  setEditingName(key.name);
                                }}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleRevokeKey(key.id)}
                              disabled={revokeKeyMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <Key className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No API Keys Yet</h3>
                    <p className="text-slate-600 mb-6">Generate your first API key to start integrating StyleSwap</p>
                    <Button
                      className="bg-orange-600 hover:bg-orange-700"
                      onClick={() => setShowNewKeyDialog(true)}
                    >
                      Generate First Key
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Revoked Keys Tab */}
          <TabsContent value="revoked" className="space-y-6">
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Revoked Keys</h3>
                  <p className="text-slate-600">Revoked API keys will appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Security Best Practices */}
        <Card className="mt-12 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Security Best Practices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-blue-900">
            <p>
              <strong>Never share your API keys:</strong> Treat API keys like passwords. Never commit them to version control or share them publicly.
            </p>
            <p>
              <strong>Rotate keys regularly:</strong> Generate new keys and revoke old ones periodically to maintain security.
            </p>
            <p>
              <strong>Use environment variables:</strong> Store API keys in environment variables or secure configuration management systems.
            </p>
            <p>
              <strong>Monitor usage:</strong> Regularly check your API key usage and revoke any keys that are no longer needed.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
