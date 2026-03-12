import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Eye, EyeOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface ApiCredentialsProps {
  appId: string;
  apiKey: string;
  apiSecret: string;
  onRegenerateSecret?: () => void;
}

export function ApiCredentials({
  appId,
  apiKey,
  apiSecret,
  onRegenerateSecret,
}: ApiCredentialsProps) {
  const [showSecret, setShowSecret] = useState(false);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const maskedSecret = showSecret
    ? apiSecret
    : "•".repeat(Math.min(apiSecret.length, 32));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>API Credentials</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* App ID */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Application ID
            </label>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={appId}
                readOnly
                className="flex-1 px-3 py-2 bg-muted border border-border rounded-md font-mono text-sm"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(appId, "App ID")}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* API Key */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              API Key
            </label>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={apiKey}
                readOnly
                className="flex-1 px-3 py-2 bg-muted border border-border rounded-md font-mono text-sm"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(apiKey, "API Key")}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* API Secret */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              API Secret
            </label>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                value={maskedSecret}
                readOnly
                className="flex-1 px-3 py-2 bg-muted border border-border rounded-md font-mono text-sm"
              />
              <Button
                size="sm"
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
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(apiSecret, "API Secret")}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Keep your API Secret secure. Never share it publicly.
            </p>
          </div>

          {/* Regenerate Secret */}
          {onRegenerateSecret && (
            <div className="pt-4 border-t">
              <Button
                variant="destructive"
                size="sm"
                onClick={onRegenerateSecret}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate Secret
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Regenerating your secret will invalidate the current one. Make
                sure to update your applications.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
