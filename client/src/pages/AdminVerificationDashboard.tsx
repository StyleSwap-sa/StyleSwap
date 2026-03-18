import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, Clock, FileText, Shield, TrendingUp, XCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

/**
 * Admin Verification Dashboard
 * Restricted to admin users only
 * Manage boutique verification applications and fraud detection
 */

export default function AdminVerificationDashboard() {
  const [selectedVerification, setSelectedVerification] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  // Fetch pending verifications
  const { data: pendingVerifications, isLoading } = trpc.verification.getPendingVerifications.useQuery();

  // Mutations
  const approveMutation = trpc.verification.approveVerification.useMutation();
  const rejectMutation = trpc.verification.rejectVerification.useMutation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Clock className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
          <p>Loading verifications...</p>
        </div>
      </div>
    );
  }

  const handleApprove = async (verificationId: number) => {
    try {
      await approveMutation.mutateAsync({
        verificationId,
        notes: adminNotes,
      });
      setSelectedVerification(null);
      setAdminNotes("");
      // Refresh data
    } catch (error) {
      console.error("Approval failed:", error);
    }
  };

  const handleReject = async (verificationId: number) => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }

    try {
      await rejectMutation.mutateAsync({
        verificationId,
        reason: rejectionReason,
        notes: adminNotes,
      });
      setSelectedVerification(null);
      setRejectionReason("");
      setAdminNotes("");
      // Refresh data
    } catch (error) {
      console.error("Rejection failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/5 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Verification Management</h1>
          <p className="text-muted-foreground">Review and approve boutique verification applications</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Pending"
            value={pendingVerifications?.filter((v) => v.status === "pending").length || 0}
            icon={Clock}
            color="amber"
          />
          <StatCard
            title="Approved"
            value={pendingVerifications?.filter((v) => v.status === "approved").length || 0}
            icon={CheckCircle2}
            color="green"
          />
          <StatCard
            title="Rejected"
            value={pendingVerifications?.filter((v) => v.status === "rejected").length || 0}
            icon={XCircle}
            color="red"
          />
          <StatCard
            title="Avg Trust Score"
            value={
              pendingVerifications
                ? Math.round(
                    pendingVerifications.reduce((sum, v) => sum + v.trustScore, 0) /
                      Math.max(pendingVerifications.length, 1)
                  )
                : 0
            }
            icon={TrendingUp}
            color="blue"
          />
        </div>

        {/* Main Content */}
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">
              Pending ({pendingVerifications?.filter((v) => v.status === "pending").length || 0})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({pendingVerifications?.filter((v) => v.status === "approved").length || 0})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({pendingVerifications?.filter((v) => v.status === "rejected").length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Pending Verifications */}
          <TabsContent value="pending" className="space-y-4">
            {pendingVerifications?.filter((v) => v.status === "pending").length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No pending verifications
                </CardContent>
              </Card>
            ) : (
              pendingVerifications
                ?.filter((v) => v.status === "pending")
                .map((verification) => (
                  <VerificationCard
                    key={verification.id}
                    verification={verification}
                    isSelected={selectedVerification === verification.id}
                    onSelect={() => setSelectedVerification(verification.id)}
                    onApprove={() => handleApprove(verification.id)}
                    onReject={() => handleReject(verification.id)}
                    rejectionReason={rejectionReason}
                    setRejectionReason={setRejectionReason}
                    adminNotes={adminNotes}
                    setAdminNotes={setAdminNotes}
                    isApproving={approveMutation.isPending}
                    isRejecting={rejectMutation.isPending}
                  />
                ))
            )}
          </TabsContent>

          {/* Approved Verifications */}
          <TabsContent value="approved" className="space-y-4">
            {pendingVerifications?.filter((v) => v.status === "approved").length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No approved verifications
                </CardContent>
              </Card>
            ) : (
              pendingVerifications
                ?.filter((v) => v.status === "approved")
                .map((verification) => (
                  <Card key={verification.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            {verification.boutiqueName}
                          </CardTitle>
                          <CardDescription>{verification.type}</CardDescription>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Approved</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Trust Score</p>
                          <p className="text-2xl font-bold text-green-600">{verification.trustScore}/100</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Risk Score</p>
                          <p className="text-2xl font-bold text-amber-600">{verification.riskScore}/100</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Submitted</p>
                          <p className="text-sm">{new Date(verification.submittedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </TabsContent>

          {/* Rejected Verifications */}
          <TabsContent value="rejected" className="space-y-4">
            {pendingVerifications?.filter((v) => v.status === "rejected").length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No rejected verifications
                </CardContent>
              </Card>
            ) : (
              pendingVerifications
                ?.filter((v) => v.status === "rejected")
                .map((verification) => (
                  <Card key={verification.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <XCircle className="w-5 h-5 text-red-600" />
                            {verification.boutiqueName}
                          </CardTitle>
                          <CardDescription>{verification.type}</CardDescription>
                        </div>
                        <Badge className="bg-red-100 text-red-800">Rejected</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Trust Score</p>
                          <p className="text-2xl font-bold text-red-600">{verification.trustScore}/100</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Risk Score</p>
                          <p className="text-2xl font-bold text-red-600">{verification.riskScore}/100</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Submitted</p>
                          <p className="text-sm">{new Date(verification.submittedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/**
 * Verification Card Component
 */
function VerificationCard({
  verification,
  isSelected,
  onSelect,
  onApprove,
  onReject,
  rejectionReason,
  setRejectionReason,
  adminNotes,
  setAdminNotes,
  isApproving,
  isRejecting,
}: {
  verification: any;
  isSelected: boolean;
  onSelect: () => void;
  onApprove: () => void;
  onReject: () => void;
  rejectionReason: string;
  setRejectionReason: (reason: string) => void;
  adminNotes: string;
  setAdminNotes: (notes: string) => void;
  isApproving: boolean;
  isRejecting: boolean;
}) {
  return (
    <Card className={`cursor-pointer transition-all ${isSelected ? "border-primary shadow-lg" : ""}`} onClick={onSelect}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              {verification.boutiqueName}
            </CardTitle>
            <CardDescription>
              {verification.type === "formal_business" ? "Formal Business" : "Social Media Seller"} • Submitted{" "}
              {new Date(verification.submittedAt).toLocaleDateString()}
            </CardDescription>
          </div>
          <Badge variant="outline">{verification.status}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Scores */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-secondary/50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">Trust Score</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 bg-secondary rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${verification.trustScore}%` }}
                />
              </div>
              <span className="font-bold text-sm">{verification.trustScore}/100</span>
            </div>
          </div>
          <div className="bg-secondary/50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">Risk Score</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 bg-secondary rounded-full h-2">
                <div
                  className="bg-red-600 h-2 rounded-full"
                  style={{ width: `${verification.riskScore}%` }}
                />
              </div>
              <span className="font-bold text-sm">{verification.riskScore}/100</span>
            </div>
          </div>
        </div>

        {/* Expandable Review Section */}
        {isSelected && (
          <div className="space-y-4 border-t pt-4">
            {/* Admin Notes */}
            <div>
              <label className="block text-sm font-semibold mb-2">Admin Notes</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes about this verification..."
                className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
                rows={3}
              />
            </div>

            {/* Rejection Reason (if rejecting) */}
            <div>
              <label className="block text-sm font-semibold mb-2">Rejection Reason (if applicable)</label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">Select a reason...</option>
                <option value="invalid_documents">Invalid or forged documents</option>
                <option value="insufficient_evidence">Insufficient evidence of business</option>
                <option value="high_risk_indicators">High risk indicators detected</option>
                <option value="incomplete_information">Incomplete information</option>
                <option value="failed_verification">Failed verification checks</option>
                <option value="other">Other (see notes)</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={onApprove}
                disabled={isApproving || isRejecting}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isApproving ? "Approving..." : "Approve"}
              </Button>
              <Button
                onClick={onReject}
                disabled={isRejecting || isApproving}
                variant="destructive"
                className="flex-1"
              >
                {isRejecting ? "Rejecting..." : "Reject"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Stat Card Component
 */
function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: any;
  color: "amber" | "green" | "red" | "blue";
}) {
  const colorClasses = {
    amber: "bg-amber-100 text-amber-700",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
