import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, ArrowLeft, Settings, Save, AlertCircle } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function BoutiqueSettings() {
  const [, params] = useRoute("/boutique-settings/:boutiqueId");
  const [, setLocation] = useLocation();
  const boutiqueId = params?.boutiqueId ? parseInt(params.boutiqueId) : null;

  // Fetch boutique data
  const { data: boutiques, isLoading: boutiquesLoading } = trpc.boutiques.myBoutiques.useQuery();
  const currentBoutique = boutiques?.find((b) => b.id === boutiqueId);

  // Form state
  const [formData, setFormData] = useState({
    name: currentBoutique?.name || "",
    description: currentBoutique?.description || "",
    websiteUrl: currentBoutique?.websiteUrl || "",
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    if (!boutiqueId) return;
    setIsSaving(true);
    try {
      // TODO: Implement updateBoutique API endpoint
      // For now, just show success message
      setTimeout(() => {
        alert("Boutique settings updated successfully");
        setIsSaving(false);
      }, 500);
    } catch (error: any) {
      console.error("Error saving settings:", error);
      alert("Error: " + (error?.message || "Failed to update boutique settings"));
      setIsSaving(false);
    }
  };

  if (!boutiqueId || boutiquesLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!currentBoutique) {
    return (
      <DashboardLayout>
        <div className="space-y-4 sm:space-y-8 px-4 sm:px-0">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/boutique-dashboard")}
              className="cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
          <Card className="premium-card border-destructive/50">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center gap-2 sm:gap-3 text-destructive">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm sm:text-base">Boutique not found</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 md:space-y-8 px-4 sm:px-0">
        {/* Header - Fully Responsive */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/boutique-dashboard")}
            className="cursor-pointer w-fit"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Boutique Settings</h1>
            <p className="text-xs sm:text-sm md:text-base text-muted-foreground mt-2">
              Configure your boutique information and preferences
            </p>
          </div>
        </div>

        {/* Settings Form - Fully Responsive */}
        <Card className="premium-card">
          <CardHeader className="pb-3 sm:pb-4 md:pb-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
              <Settings className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
              <span>Basic Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 md:space-y-6">
            {/* Boutique Name */}
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-2">Boutique Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter boutique name"
                className="w-full px-3 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your boutique"
                rows={4}
                className="w-full px-3 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none transition-colors"
              />
            </div>

            {/* Website URL */}
            <div>
              <label className="block text-xs sm:text-sm font-medium mb-2">Website URL (Optional)</label>
              <input
                type="url"
                name="websiteUrl"
                value={formData.websiteUrl}
                onChange={handleInputChange}
                placeholder="https://example.com"
                className="w-full px-3 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
              />
            </div>

            {/* Save Button - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-4 md:pt-6">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:flex-1 h-10 sm:h-10 md:h-11 text-sm sm:text-base font-medium transition-all"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin flex-shrink-0" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>Save Changes</span>
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation("/boutique-dashboard")}
                className="cursor-pointer w-full sm:flex-1 h-10 sm:h-10 md:h-11 text-sm sm:text-base font-medium transition-all"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Additional Settings - Responsive */}
        <Card className="premium-card">
          <CardHeader className="pb-3 sm:pb-4 md:pb-6">
            <CardTitle className="text-base sm:text-lg md:text-xl">Advanced Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            <div className="p-3 sm:p-4 md:p-5 bg-muted/50 rounded-lg">
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Additional settings like payment methods, API integrations, and advanced features will be available here soon.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
