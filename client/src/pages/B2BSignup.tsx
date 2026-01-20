import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { Loader2, Check, ArrowRight, Instagram, Music, Facebook, MessageCircle } from "lucide-react";

export default function B2BSignup() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    businessName: "",
    businessType: "boutique",
    website: "",
    instagramHandle: "",
    tiktokHandle: "",
    facebookUrl: "",
    whatsappNumber: "",
    description: "",
    address: "",
    city: "",
    country: "South Africa",
  });

  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const createBoutiqueMutation = trpc.boutiques.create.useMutation();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [suggestedSlug, setSuggestedSlug] = useState<string | null>(null);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              You need to sign in to register your boutique.
            </p>
            <Button
              className="w-full cursor-pointer"
              onClick={() => (window.location.href = getLoginUrl())}
            >
              Sign In with Manus
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (step === 1) {
      if (!formData.businessName || !formData.businessType) {
        setError("Please fill in all required fields");
        return;
      }
      setStep(2);
      setError("");
    } else if (step === 2) {
      // Check if at least website OR social media is provided
      const hasSocialMedia = formData.website || formData.instagramHandle || formData.tiktokHandle || formData.facebookUrl;
      if (!hasSocialMedia || !formData.address || !formData.city) {
        setError("Please provide at least a website or social media link, and your address");
        return;
      }
      setStep(3);
      setError("");
    } else if (step === 3) {
      try {
        setError("");
        const baseSlug = formData.businessName.toLowerCase().replace(/\s+/g, '-');
        let finalSlug = baseSlug;
        
        try {
          const response = await fetch('/api/trpc/boutiques.checkSlugAvailability?input=' + encodeURIComponent(JSON.stringify({ slug: baseSlug })), {
            credentials: 'include'
          });
          const result = await response.json();
          if (result.result && result.result.data) {
            const slugCheckResult = result.result.data;
            if (!slugCheckResult.available && slugCheckResult.suggestion) {
              finalSlug = slugCheckResult.suggestion;
              setSuggestedSlug(finalSlug);
              console.log('Slug collision detected, using suggested slug:', finalSlug);
            }
          }
        } catch (slugErr) {
          console.warn('Could not check slug availability, using base slug', slugErr);
        }
        
        await createBoutiqueMutation.mutateAsync({
          name: formData.businessName,
          slug: finalSlug,
          description: formData.description,
          websiteUrl: formData.website || undefined,
          instagramHandle: formData.instagramHandle || undefined,
          tiktokHandle: formData.tiktokHandle || undefined,
          facebookUrl: formData.facebookUrl || undefined,
          whatsappNumber: formData.whatsappNumber || undefined,
        });
        setSuccess(true);
        setTimeout(() => {
          setLocation("/boutique-dashboard");
        }, 2000);
      } catch (err: any) {
        setError(err.message || "Failed to create boutique");
      }
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Welcome to StyleSwap!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-primary" />
            </div>
            <p className="text-muted-foreground">
              Your boutique has been successfully registered. Redirecting to your
              dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-20">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">Register Your Boutique</h1>
          <p className="text-xl text-muted-foreground">
            Join StyleSwap and start boosting your sales with virtual try-ons
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-between mb-12">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  s <= step
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s < step ? <Check className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    s < step ? "bg-primary" : "bg-muted"
                  }`}
                ></div>
              )}
            </div>
          ))}
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {step === 1 && "Step 1: Business Information"}
              {step === 2 && "Step 2: Online Presence"}
              {step === 3 && "Step 3: Review & Confirm"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Business Information */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="businessName">Company Name *</Label>
                  <Input
                    id="businessName"
                    name="businessName"
                    placeholder="e.g., Your Company Name"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="businessType">Business Type *</Label>
                  <select
                    id="businessType"
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleInputChange}
                    className="w-full mt-2 px-3 py-2 border border-input rounded-md bg-background"
                  >
                    <option value="boutique">Boutique</option>
                    <option value="retail">Retail Store</option>
                    <option value="online">Online Store</option>
                    <option value="social">Social Media Shop</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="description">Business Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Tell us about your business..."
                    value={formData.description}
                    onChange={handleInputChange}
                    className="mt-2"
                    rows={4}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Online Presence */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Note:</strong> You can provide a website OR social media links (or both). At least one is required.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Website (Optional)</h3>
                  <div>
                    <Label htmlFor="website">Website URL</Label>
                    <Input
                      id="website"
                      name="website"
                      placeholder="www.yourboutique.com or yourboutique.com"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-4">Social Media (Optional)</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="instagramHandle" className="flex items-center gap-2">
                        <Instagram className="w-4 h-4" /> Instagram Handle
                      </Label>
                      <Input
                        id="instagramHandle"
                        name="instagramHandle"
                        placeholder="@yourboutique"
                        value={formData.instagramHandle}
                        onChange={handleInputChange}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tiktokHandle" className="flex items-center gap-2">
                        <Music className="w-4 h-4" /> TikTok Handle
                      </Label>
                      <Input
                        id="tiktokHandle"
                        name="tiktokHandle"
                        placeholder="@yourboutique"
                        value={formData.tiktokHandle}
                        onChange={handleInputChange}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="facebookUrl" className="flex items-center gap-2">
                        <Facebook className="w-4 h-4" /> Facebook Page URL
                      </Label>
                      <Input
                        id="facebookUrl"
                        name="facebookUrl"
                        placeholder="facebook.com/yourboutique"
                        value={formData.facebookUrl}
                        onChange={handleInputChange}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="whatsappNumber" className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4" /> WhatsApp Number
                      </Label>
                      <Input
                        id="whatsappNumber"
                        name="whatsappNumber"
                        placeholder="+27 123 456 7890"
                        value={formData.whatsappNumber}
                        onChange={handleInputChange}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6 space-y-4">
                  <h3 className="font-semibold">Location</h3>
                  <div>
                    <Label htmlFor="address">Street Address *</Label>
                    <Input
                      id="address"
                      name="address"
                      placeholder="123 Main Street"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="mt-2"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        name="city"
                        placeholder="Cape Town"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Country *</Label>
                      <Input
                        id="country"
                        name="country"
                        value={formData.country}
                        disabled
                        className="mt-2 bg-muted"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review & Confirm */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="bg-muted/50 p-6 rounded-lg space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Business Name
                    </div>
                    <div className="font-semibold">{formData.businessName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Business Type
                    </div>
                    <div className="font-semibold capitalize">{formData.businessType}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Description
                    </div>
                    <div className="font-semibold">{formData.description || "Not provided"}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">
                      Location
                    </div>
                    <div className="font-semibold">{formData.city}, {formData.country}</div>
                  </div>
                  {formData.website && (
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Website
                      </div>
                      <div className="font-semibold">{formData.website}</div>
                    </div>
                  )}
                  {(formData.instagramHandle || formData.tiktokHandle || formData.facebookUrl) && (
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Social Media
                      </div>
                      <div className="space-y-1">
                        {formData.instagramHandle && <div className="text-sm">Instagram: {formData.instagramHandle}</div>}
                        {formData.tiktokHandle && <div className="text-sm">TikTok: {formData.tiktokHandle}</div>}
                        {formData.facebookUrl && <div className="text-sm">Facebook: {formData.facebookUrl}</div>}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-4 rounded-lg">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    ✓ After registration, you'll get access to your boutique dashboard and can start uploading products immediately.
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    💡 <strong>Free Landing Page:</strong> If you don't have a website, we'll create a free landing page for your boutique that you can share on social media!
                  </p>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    By clicking "Create Boutique", you agree to our Terms of Service and Privacy Policy.
                    You'll receive a welcome email with next steps.
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="flex-1"
                >
                  Back
                </Button>
              )}
              {step < 3 ? (
                <Button
                  onClick={handleSubmit}
                  className="flex-1 gap-2"
                  disabled={createBoutiqueMutation.isPending}
                >
                  Next <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  className="flex-1 gap-2"
                  disabled={createBoutiqueMutation.isPending}
                >
                  {createBoutiqueMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Boutique <Check className="w-4 h-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
