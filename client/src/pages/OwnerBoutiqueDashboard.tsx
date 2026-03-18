import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Eye, Settings, Users } from "lucide-react";
import BoutiqueDashboard from "./BoutiqueDashboard";
import BoutiqueOnboardingManager from "@/components/BoutiqueOnboardingManager";

export default function OwnerBoutiqueDashboard() {
  const [selectedBoutiqueId, setSelectedBoutiqueId] = useState<number | null>(
    null
  );
  const [viewMode, setViewMode] = useState<"list" | "detail" | "onboarding">("list");

  // Get all boutiques
  const { data: boutiques, isLoading } = trpc.boutiques.getAllBoutiques.useQuery(
    { status: "active" },
    { retry: false }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // If viewing onboarding management
  if (viewMode === "onboarding") {
    const onboardingBoutiques = boutiques?.map((b) => ({
      id: b.id,
      name: b.name,
      email: b.email || "",
      businessType: b.businessType || "boutique",
      status: (b.status as "pending" | "verified" | "rejected") || "pending",
      createdAt: b.createdAt || new Date().toISOString(),
      website: b.website,
    })) || [];

    return (
      <div>
        <div className="mb-4 flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setViewMode("list");
              setSelectedBoutiqueId(null);
            }}
          >
            ← Back to Boutiques List
          </Button>
          <span className="text-sm text-muted-foreground">
            Owner Testing Mode: Boutique Onboarding Management
          </span>
        </div>
        <BoutiqueOnboardingManager boutiques={onboardingBoutiques} />
      </div>
    );
  }

  // If viewing a specific boutique, show the boutique dashboard
  if (viewMode === "detail" && selectedBoutiqueId) {
    return (
      <div>
        <div className="mb-4 flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setViewMode("list");
              setSelectedBoutiqueId(null);
            }}
          >
            ← Back to Boutiques List
          </Button>
          <span className="text-sm text-muted-foreground">
            Owner Testing Mode: Viewing Boutique #{selectedBoutiqueId}
          </span>
        </div>
        <BoutiqueDashboard
          boutique={
            boutiques?.find((b) => b.id === selectedBoutiqueId) || null
          }
        />
      </div>
    );
  }

  // Show list of all boutiques
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Boutique Management</h1>
          <p className="text-muted-foreground mt-2">
            Owner Testing Mode - View and manage all boutiques
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setViewMode("onboarding")}
          >
            Onboarding Management
          </Button>
          <Badge variant="secondary">Owner Mode</Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Boutiques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{boutiques?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Boutiques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {boutiques?.filter((b) => b.status === "active").length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Credits Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {boutiques
                ?.reduce((sum, b) => sum + (b.creditsUsed || 0), 0)
                .toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Credits Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {boutiques
                ?.reduce((sum, b) => sum + (b.creditsAvailable || 0), 0)
                .toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Boutiques Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Boutiques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Boutique Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Credits Available</TableHead>
                  <TableHead className="text-right">Credits Used</TableHead>
                  <TableHead className="text-right">Try-Ons</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {boutiques && boutiques.length > 0 ? (
                  boutiques.map((boutique) => (
                    <TableRow key={boutique.id}>
                      <TableCell className="font-medium">
                        {boutique.name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {boutique.slug}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            boutique.status === "active"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {boutique.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {boutique.creditsAvailable?.toLocaleString() || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        {boutique.creditsUsed?.toLocaleString() || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        {boutique.tryOnsCount || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedBoutiqueId(boutique.id);
                            setViewMode("detail");
                          }}
                          className="gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">
                        No boutiques found
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
