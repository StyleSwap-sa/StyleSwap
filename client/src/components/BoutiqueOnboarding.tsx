import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Store, MapPin, Phone, Mail, Instagram, Facebook } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface BoutiqueOnboardingProps {
  onComplete?: () => void;
}

export function BoutiqueOnboarding({ onComplete }: BoutiqueOnboardingProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    boutiqueName: "",
    description: "",
    location: "",
    phone: "",
    email: "",
    instagramHandle: "",
    facebookHandle: "",
    logoUrl: "",
  });

  const updateBoutiqueMutation = trpc.boutiques.updateProfile.useMutation();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!formData.boutiqueName.trim()) {
        alert("Please enter your boutique name");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.location.trim() || !formData.phone.trim()) {
        alert("Please enter your location and phone number");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      setLoading(true);
      try {
        await updateBoutiqueMutation.mutateAsync({
          name: formData.boutiqueName,
          description: formData.description || "",
          location: formData.location || "",
          phone: formData.phone || "",
          email: formData.email || "",
          instagramHandle: formData.instagramHandle || "",
          facebookHandle: formData.facebookHandle || "",
          logoUrl: formData.logoUrl || "",
        });
        onComplete?.();
      } catch (error) {
        console.error("Failed to complete onboarding:", error);
        alert("Failed to save boutique information. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/10 to-primary/10 p-4 flex items-center justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-6 h-6 text-secondary" />
            Welcome to StyleSwap Boutique
          </CardTitle>
          <CardDescription>
            Step {step} of 3 - Set up your boutique profile
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Boutique Name *</label>
                <Input
                  name="boutiqueName"
                  placeholder="Enter your boutique name"
                  value={formData.boutiqueName}
                  onChange={handleInputChange}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <Textarea
                  name="description"
                  placeholder="Tell customers about your boutique (optional)"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> A good description helps customers understand your style and brand.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Contact Info */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Location *
                </label>
                <Input
                  name="location"
                  placeholder="City, Country (e.g., Lagos, Nigeria)"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Phone Number *
                </label>
                <Input
                  name="phone"
                  placeholder="+234 123 456 7890"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email
                </label>
                <Input
                  name="email"
                  type="email"
                  placeholder="contact@boutique.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Step 3: Social Media */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Instagram className="w-4 h-4" /> Instagram Handle
                </label>
                <Input
                  name="instagramHandle"
                  placeholder="@yourboutique"
                  value={formData.instagramHandle}
                  onChange={handleInputChange}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Facebook className="w-4 h-4" /> Facebook Page
                </label>
                <Input
                  name="facebookHandle"
                  placeholder="facebook.com/yourboutique"
                  value={formData.facebookHandle}
                  onChange={handleInputChange}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Logo URL
                </label>
                <Input
                  name="logoUrl"
                  placeholder="https://example.com/logo.png"
                  value={formData.logoUrl}
                  onChange={handleInputChange}
                  className="w-full"
                />
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  ✓ <strong>Almost done!</strong> Click "Complete Setup" to finish your onboarding.
                </p>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1 || loading}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={loading}
              className="flex-1 bg-secondary hover:bg-secondary/90"
            >
              {loading ? "Saving..." : step === 3 ? "Complete Setup" : "Next"}
            </Button>
          </div>

          {/* Progress Indicator */}
          <div className="flex gap-2 justify-center pt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 w-8 rounded-full transition-colors ${
                  s <= step ? "bg-secondary" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
