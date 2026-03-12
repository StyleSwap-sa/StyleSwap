import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, ArrowRight, AlertCircle, Copy, Check, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function RegisterApp() {
  const [formData, setFormData] = useState({
    appName: "",
    companyName: "",
    email: "",
    website: "",
    description: "",
    platformType: "web",
  });

  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [credentials, setCredentials] = useState<{
    apiKey: string;
    apiSecret: string;
    appName: string;
    email: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const registerMutation = trpc.appRegistration.registerApp.useMutation({
    onSuccess: (data) => {
      if (data.success && data.registration) {
        setCredentials({
          apiKey: data.registration.apiKey,
          apiSecret: data.registration.apiSecret,
          appName: data.registration.appName,
          email: data.registration.email,
        });
        setSubmitted(true);
      }
    },
    onError: (error) => {
      setErrors({
        submit: error.message || "Failed to register application",
      });
    },
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.appName.trim()) newErrors.appName = "App name is required";
    if (!formData.companyName.trim()) newErrors.companyName = "Company name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.email.includes("@")) newErrors.email = "Valid email is required";
    if (!formData.website.trim()) newErrors.website = "Website is required";
    if (!formData.website.startsWith("http")) newErrors.website = "Website must start with http:// or https://";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    if (formData.description.trim().length < 10) newErrors.description = "Description must be at least 10 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      registerMutation.mutate({
        appName: formData.appName,
        companyName: formData.companyName,
        email: formData.email,
        website: formData.website,
        platformType: formData.platformType as "web" | "mobile" | "shopify" | "woocommerce" | "custom",
        description: formData.description,
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (submitted && credentials) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4 py-12">
        <Card className="max-w-2xl w-full border-2 border-green-200">
          <CardContent className="pt-12 pb-12 space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-slate-900">Registration Successful! 🎉</h2>
              <p className="text-slate-600">
                Your API credentials have been generated instantly. Save them in a secure location.
              </p>
            </div>

            {/* Credentials Display */}
            <div className="bg-slate-50 p-6 rounded-lg space-y-4 border border-slate-200">
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">API Key</p>
                <div className="flex items-center gap-2 bg-white p-3 rounded border border-slate-300">
                  <code className="text-sm font-mono text-slate-900 flex-1 break-all">
                    {credentials.apiKey}
                  </code>
                  <button
                    onClick={() => copyToClipboard(credentials.apiKey, "apiKey")}
                    className="flex-shrink-0 p-2 hover:bg-slate-100 rounded transition"
                    title="Copy API Key"
                  >
                    {copiedField === "apiKey" ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-600" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">API Secret</p>
                <div className="flex items-center gap-2 bg-white p-3 rounded border border-slate-300">
                  <code className="text-sm font-mono text-slate-900 flex-1 break-all">
                    {credentials.apiSecret}
                  </code>
                  <button
                    onClick={() => copyToClipboard(credentials.apiSecret, "apiSecret")}
                    className="flex-shrink-0 p-2 hover:bg-slate-100 rounded transition"
                    title="Copy API Secret"
                  >
                    {copiedField === "apiSecret" ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-600" />
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Important:</strong> Store your API secret in a secure location. You won't be able to view it again.
                </p>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg space-y-3">
              <h3 className="font-semibold text-blue-900">Next Steps</h3>
              <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                <li>Save your API credentials in a secure location</li>
                <li>Check your email at <strong>{credentials.email}</strong> for confirmation and documentation</li>
                <li>Visit the <a href="/api-docs" className="underline font-semibold">API Documentation</a> to get started</li>
                <li>Use your API key to authenticate requests to StyleSwap</li>
              </ol>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => window.location.href = "/api-docs"}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                View API Docs
              </Button>
              <Button
                onClick={() => window.location.href = "/"}
                variant="outline"
                className="flex-1"
              >
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-40">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-slate-900">Register Your Application</h1>
          <p className="text-slate-600 mt-1">Get API credentials instantly and start integrating StyleSwap</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {errors.submit && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-800">{errors.submit}</p>
                    </div>
                  )}

                  {/* App Name */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-900">
                      Application Name *
                    </label>
                    <Input
                      type="text"
                      name="appName"
                      value={formData.appName}
                      onChange={handleChange}
                      placeholder="e.g., My Fashion Store"
                      className={errors.appName ? "border-red-500" : ""}
                      disabled={registerMutation.isPending}
                    />
                    {errors.appName && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" /> {errors.appName}
                      </p>
                    )}
                  </div>

                  {/* Company Name */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-900">
                      Company Name *
                    </label>
                    <Input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="e.g., Fashion Retail Inc."
                      className={errors.companyName ? "border-red-500" : ""}
                      disabled={registerMutation.isPending}
                    />
                    {errors.companyName && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" /> {errors.companyName}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-900">
                      Email Address *
                    </label>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      className={errors.email ? "border-red-500" : ""}
                      disabled={registerMutation.isPending}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" /> {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Website */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-900">
                      Website URL *
                    </label>
                    <Input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="https://example.com"
                      className={errors.website ? "border-red-500" : ""}
                      disabled={registerMutation.isPending}
                    />
                    {errors.website && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" /> {errors.website}
                      </p>
                    )}
                  </div>

                  {/* Platform */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-900">
                      Platform Type
                    </label>
                    <select
                      name="platformType"
                      value={formData.platformType}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      disabled={registerMutation.isPending}
                    >
                      <option value="web">Web Application</option>
                      <option value="mobile">Mobile App</option>
                      <option value="shopify">Shopify Store</option>
                      <option value="woocommerce">WooCommerce</option>
                      <option value="custom">Custom Integration</option>
                    </select>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-900">
                      How do you plan to use StyleSwap? *
                    </label>
                    <Textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Tell us about your use case..."
                      rows={4}
                      className={errors.description ? "border-red-500" : ""}
                      disabled={registerMutation.isPending}
                    />
                    {errors.description && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" /> {errors.description}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full bg-orange-600 hover:bg-orange-700 font-semibold h-12"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      <>
                        Register Application <ArrowRight className="ml-2 w-4 h-4" />
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-slate-500 text-center">
                    By registering, you agree to our Terms of Service and Privacy Policy
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* What You'll Get */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What You'll Get</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">Instant API Keys</p>
                    <p className="text-sm text-slate-600">Live API credentials generated immediately</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">Full Documentation</p>
                    <p className="text-sm text-slate-600">Complete API reference and examples</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">Developer Support</p>
                    <p className="text-sm text-slate-600">Email support and community access</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">Webhook Integration</p>
                    <p className="text-sm text-slate-600">Real-time event notifications</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-600">
                <p>✓ Valid business email</p>
                <p>✓ Company website</p>
                <p>✓ Clear use case description</p>
                <p>✓ Compliance with Terms of Service</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
