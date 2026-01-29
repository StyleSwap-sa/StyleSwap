import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { BoutiqueTryOn } from "@/components/BoutiqueTryOn";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function BoutiqueTryOnPage() {
  const [, setLocation] = useLocation();

  // Fetch user's boutiques
  const { data: boutiques, isLoading: boutiquesLoading } =
    trpc.boutiques.myBoutiques.useQuery();

  const [selectedBoutiqueId, setSelectedBoutiqueId] = useState<number | null>(
    boutiques?.[0]?.id || null
  );

  if (boutiquesLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!boutiques || boutiques.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Link href="/boutique-dashboard">
            <Button variant="ghost" className="cursor-pointer">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          <Card className="border-yellow-500/30 bg-yellow-50 dark:bg-yellow-950/20">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  You don't have any boutiques yet. Please register a boutique first.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const currentBoutique = boutiques.find((b) => b.id === selectedBoutiqueId);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/boutique-dashboard">
              <Button variant="ghost" className="cursor-pointer mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-4xl font-bold">Test Try-Ons</h1>
            <p className="text-muted-foreground mt-2">
              Test your products with different clothing types before offering to customers
            </p>
          </div>
        </div>

        {/* Boutique Selector */}
        {boutiques.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Boutique</CardTitle>
            </CardHeader>
            <CardContent>
              <select
                value={selectedBoutiqueId || ""}
                onChange={(e) => setSelectedBoutiqueId(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
              >
                {boutiques.map((boutique) => (
                  <option key={boutique.id} value={boutique.id}>
                    Boutique #{boutique.id} - {boutique.name}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="bg-primary/5 border-primary/30">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <h3 className="font-semibold">How to Test Try-Ons</h3>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>Select the clothing type (Top, Bottom, Full Dress, or Top & Bottom)</li>
                <li>Upload a model photo (full-body, front view)</li>
                <li>Upload your clothing item image</li>
                <li>For Top & Bottom, upload both top and bottom images</li>
                <li>Click "Generate Try-On" to see the result</li>
              </ol>
              <p className="text-xs text-muted-foreground mt-4">
                Each try-on uses 1 credit. Make sure you have enough credits available.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Try-On Component */}
        {selectedBoutiqueId && (
          <BoutiqueTryOn boutiqueId={selectedBoutiqueId} />
        )}
      </div>
    </DashboardLayout>
  );
}
