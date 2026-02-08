import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, Clock, AlertCircle, Mail } from "lucide-react";

interface BoutiqueOnboarding {
  id: number;
  name: string;
  email: string;
  businessType: string;
  status: "pending" | "verified" | "rejected";
  createdAt: string;
  verificationDate?: string;
  website?: string;
  socialMedia?: string;
}

interface BoutiqueOnboardingManagerProps {
  boutiques: BoutiqueOnboarding[];
  onApprove?: (boutiqueId: number) => void;
  onReject?: (boutiqueId: number) => void;
  onResendVerification?: (boutiqueId: number) => void;
}

export default function BoutiqueOnboardingManager({
  boutiques,
  onApprove,
  onReject,
  onResendVerification,
}: BoutiqueOnboardingManagerProps) {
  const [selectedStatus, setSelectedStatus] = useState<
    "all" | "pending" | "verified" | "rejected"
  >("all");

  const filteredBoutiques =
    selectedStatus === "all"
      ? boutiques
      : boutiques.filter((b) => b.status === selectedStatus);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "rejected":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge variant="default">Verified</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending Verification</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Boutique Onboarding Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Filter */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedStatus === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStatus("all")}
            >
              All ({boutiques.length})
            </Button>
            <Button
              variant={selectedStatus === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStatus("pending")}
            >
              Pending ({boutiques.filter((b) => b.status === "pending").length})
            </Button>
            <Button
              variant={selectedStatus === "verified" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStatus("verified")}
            >
              Verified ({boutiques.filter((b) => b.status === "verified").length}
              )
            </Button>
            <Button
              variant={selectedStatus === "rejected" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedStatus("rejected")}
            >
              Rejected ({boutiques.filter((b) => b.status === "rejected").length}
              )
            </Button>
          </div>

          {/* Boutiques Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Boutique Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Business Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Signup Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBoutiques && filteredBoutiques.length > 0 ? (
                  filteredBoutiques.map((boutique) => (
                    <TableRow key={boutique.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(boutique.status)}
                          {boutique.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {boutique.email}
                      </TableCell>
                      <TableCell className="text-sm capitalize">
                        {boutique.businessType}
                      </TableCell>
                      <TableCell>{getStatusBadge(boutique.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(boutique.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {boutique.status === "pending" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  onResendVerification?.(boutique.id)
                                }
                                className="gap-1"
                              >
                                <Mail className="w-4 h-4" />
                                Resend
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => onApprove?.(boutique.id)}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => onReject?.(boutique.id)}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          {boutique.status === "verified" && (
                            <span className="text-sm text-green-600 font-medium">
                              ✓ Active
                            </span>
                          )}
                          {boutique.status === "rejected" && (
                            <span className="text-sm text-red-600 font-medium">
                              ✗ Rejected
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <p className="text-muted-foreground">
                        No boutiques found with this status
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {boutiques.filter((b) => b.status === "pending").length}
              </div>
              <p className="text-sm text-muted-foreground">Pending Verification</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {boutiques.filter((b) => b.status === "verified").length}
              </div>
              <p className="text-sm text-muted-foreground">Verified Boutiques</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {boutiques.filter((b) => b.status === "rejected").length}
              </div>
              <p className="text-sm text-muted-foreground">Rejected</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
