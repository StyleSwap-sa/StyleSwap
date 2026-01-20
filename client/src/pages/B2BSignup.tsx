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
import { Loader2, Check, ArrowRight } from "lucide-react";

export default function B2BSignup() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    businessName: "",
    businessType: "boutique",
    website: "",
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
      if (!formData.website || !formData.address || !formData.city) {
        setError("Please fill in all required fields");
        return;
      }
      setStep(3);
      setError("");
    } else if (step === 3) {
      try {
        setError("");
        await createBoutiqueMutation.mutateAsync({
          name: formData.businessName,
          slug: formData.businessName.toLowerCase().replace(/\s+/g, '-'),
          description: formData.description,
          websiteUrl: formData.website,
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

        <Card className="premium-card">
          <CardHeader>
            <CardTitle>
              {step === 1 && "Business Information"}
              {step === 2 && "Location & Website"}
              {step === 3 && "Review & Confirm"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Business Information */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    name="businessName"
                    placeholder="Your boutique name"
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
                    <option value="retail_store">Retail Store</option>
                    <option value="ecommerce">E-commerce</option>
                    <option value="fashion_brand">Fashion Brand</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="+27 (0) 123 456 7890"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="mt-2"
                  />
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

            {/* Step 2: Location & Website */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="website">Website URL *</Label>
                  <Input
                    id="website"
                    name="website"
                    placeholder="https://www.yourboutique.com"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="mt-2"
                  />
                </div>
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
                    <div className="text-sm text-muted-foreground">Type</div>
                    <div className="font-semibold capitalize">
                      {formData.businessType.replace("_", " ")}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Website</div>
                    <div className="font-semibold">{formData.website}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Location</div>
                    <div className="font-semibold">
                      {formData.city}, {formData.country}
                    </div>
                  </div>
                </div>

                <div className="bg-primary/10 border border-primary/30 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    By clicking "Create Boutique", you agree to our Terms of
                    Service and Privacy Policy. You'll receive a welcome email
                    with next steps.
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg text-red-600">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="cursor-pointer"
                >
                  Back
                </Button>
              )}
              <Button
                onClick={handleSubmit}
                disabled={createBoutiqueMutation.isPending}
                className="flex-1 cursor-pointer"
              >
                {createBoutiqueMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {step === 3
                  ? createBoutiqueMutation.isPending
                    ? "Creating..."
                    : "Create Boutique"
                  : "Continue"}
                {step < 3 && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          {[
            {
              title: "Easy Setup",
              desc: "Add the widget to your site in minutes with our simple embed code",
            },
            {
              title: "24/7 Support",
              desc: "Get help whenever you need it from our dedicated support team",
            },
          ].map((benefit, i) => (
            <Card key={i} className="premium-card text-center">
              <CardContent className="pt-6">
                <h3 className="font-bold mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
