import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

export default function ModerationDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<"pending" | "approved" | "rejected" | "deleted" | undefined>(
    "pending"
  );

  const { data: flaggedData, isLoading } = trpc.moderation.getFlaggedComments.useQuery(
    { status: selectedStatus, limit: 50 },
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  const { data: logsData } = trpc.moderation.getModerationLogs.useQuery(
    { limit: 20 },
    { enabled: isAuthenticated && user?.role === "admin" }
  );

  const approveMutation = trpc.moderation.approveFlaggedComment.useMutation();
  const rejectMutation = trpc.moderation.rejectFlaggedComment.useMutation();
  const deleteMutation = trpc.moderation.deleteFlaggedComment.useMutation();

  const handleApprove = (flaggedCommentId: number) => {
    approveMutation.mutate({ flaggedCommentId, notes: "Approved by moderator" });
  };

  const handleReject = (flaggedCommentId: number) => {
    rejectMutation.mutate({ flaggedCommentId, notes: "Rejected by moderator" });
  };

  const handleDelete = (flaggedCommentId: number) => {
    deleteMutation.mutate({ flaggedCommentId, notes: "Deleted by moderator" });
  };

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Only administrators can access the moderation dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <AlertTriangle className="w-8 h-8 text-red-600" />
          <h1 className="text-3xl font-bold">Moderation Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Flagged Comments Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Flagged Comments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  {["pending", "approved", "rejected", "deleted"].map((status) => (
                    <Button
                      key={status}
                      variant={selectedStatus === status ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        setSelectedStatus(status as "pending" | "approved" | "rejected" | "deleted")
                      }
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Button>
                  ))}
                </div>

                <div className="space-y-4">
                  {isLoading ? (
                    <p className="text-muted-foreground">Loading...</p>
                  ) : flaggedData?.flaggedComments && flaggedData.flaggedComments.length > 0 ? (
                    flaggedData.flaggedComments.map((flagged: any) => (
                      <Card key={flagged.id} className="border-red-200 bg-red-50">
                        <CardContent className="pt-6">
                          <div className="space-y-3">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="destructive">{flagged.reason}</Badge>
                                <Badge
                                  variant={
                                    flagged.status === "pending"
                                      ? "outline"
                                      : flagged.status === "approved"
                                      ? "secondary"
                                      : "destructive"
                                  }
                                >
                                  {flagged.status}
                                </Badge>
                              </div>
                              <p className="font-semibold">
                                Reported by: {flagged.reporterName}
                              </p>
                            </div>

                            <div className="bg-white p-3 rounded border">
                              <p className="text-sm text-muted-foreground">
                                <strong>Comment:</strong> {flagged.comment}
                              </p>
                            </div>

                            {flagged.description && (
                              <p className="text-sm text-muted-foreground">
                                <strong>Report Reason:</strong> {flagged.description}
                              </p>
                            )}

                            {flagged.moderationNotes && (
                              <p className="text-sm text-muted-foreground">
                                <strong>Moderation Notes:</strong> {flagged.moderationNotes}
                              </p>
                            )}

                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(flagged.createdAt), {
                                addSuffix: true,
                              })}
                            </p>

                            {flagged.status === "pending" && (
                              <div className="flex gap-2 pt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleApprove(flagged.id)}
                                  disabled={approveMutation.isPending}
                                  className="text-green-600 border-green-600 hover:bg-green-50"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleReject(flagged.id)}
                                  disabled={rejectMutation.isPending}
                                  className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(flagged.id)}
                                  disabled={deleteMutation.isPending}
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center">
                      No flagged comments with status: {selectedStatus}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Moderation Logs Section */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Moderation Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {logsData?.logs && logsData.logs.length > 0 ? (
                    logsData.logs.map((log: any) => (
                      <div key={log.id} className="border-l-4 border-primary pl-3 py-2">
                        <p className="text-sm font-semibold">{log.moderatorName}</p>
                        <p className="text-xs text-muted-foreground">
                          <strong>{log.action}</strong> on {log.targetType}
                        </p>
                        {log.reason && (
                          <p className="text-xs text-muted-foreground">
                            Reason: {log.reason}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(log.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">No recent actions</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
