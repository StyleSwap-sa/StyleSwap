import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CheckCircle2, ArrowRight, Copy, Check } from "lucide-react";
import { trpc } from "@/lib/trpc";

/**
 * OnboardingWizard Component
 * Multi-step setup flow for new retailers
 */

export default function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [apiKeyName, setApiKeyName] = useState("My First API Key");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [generatedApiKey, setGeneratedApiKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const createApiKeyMutation = trpc.apiKeys.createApiKey.useMutation();
  const verifyApiKeyMutation = trpc.protectedApi.verifyApiKeyMutation.useMutation();

  const handleGenerateApiKey = async () => {
    try {
      // Generate API key through tRPC
      const result = await createApiKeyMutation.mutateAsync({
        name: apiKeyName,
        description: "Generated during onboarding",
      });

      if (result && typeof result === "object" && "key" in result) {
        setGeneratedApiKey(result.key);
      }
    } catch (error) {
      console.error("Error generating API key:", error);
    }
  };

  const handleCopyApiKey = () => {
    if (generatedApiKey) {
      navigator.clipboard.writeText(generatedApiKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleVerifyApiKey = async () => {
    if (!generatedApiKey) return;

    try {
      const result = await verifyApiKeyMutation.mutateAsync({
        apiKey: generatedApiKey,
      });

      if (result && typeof result === "object" && "valid" in result && result.valid) {
        setCurrentStep(4);
      }
    } catch (error) {
      console.error("Error verifying API key:", error);
    }
  };

  const handleCompleteOnboarding = () => {
    // Mark onboarding as complete
    console.log("Onboarding completed!");
    // Redirect to dashboard or next step
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/5 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Welcome to StyleSwap</h1>
          <p className="text-lg text-muted-foreground">
            Get your virtual try-on API up and running in 4 simple steps
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-between mb-12">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 font-bold ${
                  step < currentStep
                    ? "bg-green-500 text-white"
                    : step === currentStep
                      ? "bg-primary text-white"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {step < currentStep ? <CheckCircle2 size={24} /> : step}
              </div>
              <p className="text-sm font-medium text-center">
                {step === 1 && "Generate Key"}
                {step === 2 && "Configure Webhook"}
                {step === 3 && "Test Integration"}
                {step === 4 && "Complete"}
              </p>
            </div>
          ))}
        </div>

        {/* Step 1: Generate API Key */}
        {currentStep === 1 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Step 1: Generate Your API Key</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  API Key Name
                </label>
                <Input
                  value={apiKeyName}
                  onChange={(e) => setApiKeyName(e.target.value)}
                  placeholder="e.g., Production API Key"
                  className="mb-4"
                />
                <p className="text-sm text-muted-foreground mb-4">
                  Give your API key a descriptive name to help you identify it
                  later.
                </p>
              </div>

              {!generatedApiKey ? (
                <Button
                  onClick={handleGenerateApiKey}
                  disabled={createApiKeyMutation.isPending}
                  className="w-full"
                >
                  {createApiKeyMutation.isPending ? "Generating..." : "Generate API Key"}
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">
                      Your API Key (save this securely):
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-background p-2 rounded font-mono text-sm break-all">
                        {generatedApiKey}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCopyApiKey}
                      >
                        {copiedKey ? (
                          <Check size={16} />
                        ) : (
                          <Copy size={16} />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <p className="text-sm text-yellow-900">
                      <strong>⚠️ Important:</strong> Save your API key in a
                      secure location. You won't be able to view it again.
                    </p>
                  </div>

                  <Button
                    onClick={() => setCurrentStep(2)}
                    className="w-full"
                  >
                    Next Step <ArrowRight className="ml-2" size={16} />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Configure Webhook */}
        {currentStep === 2 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Step 2: Configure Webhook Endpoint</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Webhook URL
                </label>
                <Input
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://your-domain.com/webhooks/styleswap"
                  type="url"
                  className="mb-4"
                />
                <p className="text-sm text-muted-foreground mb-4">
                  We'll send API events (try-on completions, errors) to this
                  URL. Leave blank to skip for now.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>💡 Tip:</strong> You can configure webhooks later in
                  your Developer Portal.
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setCurrentStep(3)}
                  className="flex-1"
                >
                  Next Step <ArrowRight className="ml-2" size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Test Integration */}
        {currentStep === 3 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Step 3: Test Your Integration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  Let's verify your API key is working correctly.
                </p>

                <Button
                  onClick={handleVerifyApiKey}
                  disabled={verifyApiKeyMutation.isPending}
                  className="w-full mb-4"
                >
                  {verifyApiKeyMutation.isPending
                    ? "Testing..."
                    : "Test API Key"}
                </Button>

                {verifyApiKeyMutation.isSuccess && (
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
                    <p className="text-sm text-green-900">
                      ✅ API key verified successfully!
                    </p>
                  </div>
                )}

                {verifyApiKeyMutation.isError && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
                    <p className="text-sm text-red-900">
                      ❌ API key verification failed. Please check your key and
                      try again.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(2)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setCurrentStep(4)}
                  className="flex-1"
                >
                  Next Step <ArrowRight className="ml-2" size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Complete */}
        {currentStep === 4 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>🎉 You're All Set!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-green-50 border border-green-200 p-6 rounded-lg text-center">
                <CheckCircle2 size={48} className="mx-auto mb-4 text-green-600" />
                <h3 className="text-lg font-bold mb-2 text-green-900">
                  Onboarding Complete
                </h3>
                <p className="text-sm text-green-800">
                  Your API is ready to use. Start integrating StyleSwap's
                  virtual try-on feature into your platform.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold">Next Steps:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex gap-2">
                    <span className="text-primary">→</span>
                    <span>
                      Visit the{" "}
                      <a href="/developer" className="text-primary hover:underline">
                        Developer Portal
                      </a>{" "}
                      for API documentation
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">→</span>
                    <span>
                      Check the{" "}
                      <a href="/widget-builder" className="text-primary hover:underline">
                        Widget Builder
                      </a>{" "}
                      to customize your integration
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">→</span>
                    <span>
                      Monitor your usage in the{" "}
                      <a href="/api-usage" className="text-primary hover:underline">
                        Analytics Dashboard
                      </a>
                    </span>
                  </li>
                </ul>
              </div>

              <Button
                onClick={handleCompleteOnboarding}
                className="w-full"
              >
                Go to Developer Portal
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
