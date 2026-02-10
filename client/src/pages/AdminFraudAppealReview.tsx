import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  Download,
  ExternalLink,
  Clock,
  User,
  FileText,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';

/**
 * Admin Fraud Appeal Review Interface
 * Allows admins to review and decide on fraud appeals
 */

interface Appeal {
  id: number;
  boutique: {
    id: number;
    name: string;
    email: string;
  };
  fraudFlag: {
    id: number;
    flagType: string;
    reason: string;
    severity: string;
  };
  reason: string;
  evidence: Array<{
    filename: string;
    url: string;
    type: string;
  }>;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export default function AdminFraudAppealReview() {
  const [filterStatus, setFilterStatus] = useState('pending');
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch pending appeals
  const { data: appeals, isLoading, refetch } = trpc.adminFraudAppeals.getAppeals.useQuery(
    { status: filterStatus },
    { enabled: true }
  );

  // Approve appeal mutation
  const { mutate: approveAppeal } = trpc.adminFraudAppeals.approveAppeal.useMutation({
    onSuccess: () => {
      setSelectedAppeal(null);
      setReviewNotes('');
      refetch();
    },
  });

  // Reject appeal mutation
  const { mutate: rejectAppeal } = trpc.adminFraudAppeals.rejectAppeal.useMutation({
    onSuccess: () => {
      setSelectedAppeal(null);
      setReviewNotes('');
      refetch();
    },
  });

  const handleApproveAppeal = () => {
    if (!selectedAppeal || !reviewNotes.trim()) {
      alert('Please provide review notes');
      return;
    }

    setIsSubmitting(true);
    approveAppeal({
      appealId: selectedAppeal.id,
      reviewNotes,
    });
  };

  const handleRejectAppeal = () => {
    if (!selectedAppeal || !reviewNotes.trim()) {
      alert('Please provide review notes');
      return;
    }

    setIsSubmitting(true);
    rejectAppeal({
      appealId: selectedAppeal.id,
      reviewNotes,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Appeals List */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Fraud Appeals</CardTitle>
            <CardDescription>Review and decide on appeals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Filter */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            {/* Appeals List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {appeals && appeals.length > 0 ? (
                appeals.map((appeal: Appeal) => (
                  <div
                    key={appeal.id}
                    className={`p-3 border rounded-lg cursor-pointer transition ${
                      selectedAppeal?.id === appeal.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => {
                      setSelectedAppeal(appeal);
                      setReviewNotes('');
                    }}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="font-medium text-sm">{appeal.boutique.name}</div>
                      <Badge
                        variant={
                          appeal.status === 'approved'
                            ? 'default'
                            : appeal.status === 'rejected'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {appeal.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {appeal.fraudFlag.flagType}
                    </p>
                    <div className="text-xs text-muted-foreground">
                      {new Date(appeal.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No appeals to review</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appeal Details */}
      <div className="lg:col-span-2">
        {selectedAppeal ? (
          <div className="space-y-4">
            {/* Boutique Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Boutique Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p className="font-medium">{selectedAppeal.boutique.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="font-medium">{selectedAppeal.boutique.email}</p>
                </div>
              </CardContent>
            </Card>

            {/* Fraud Flag Info */}
            <Card>
              <CardHeader>
                <CardTitle>Fraud Flag Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Flag Type</label>
                  <p className="font-medium">{selectedAppeal.fraudFlag.flagType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Reason</label>
                  <p className="text-sm">{selectedAppeal.fraudFlag.reason}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Severity</label>
                  <Badge className="mt-1">{selectedAppeal.fraudFlag.severity}</Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Flagged On</label>
                  <p className="text-sm">
                    {new Date(selectedAppeal.createdAt).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Appeal Reason */}
            <Card>
              <CardHeader>
                <CardTitle>Appeal Reason</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{selectedAppeal.reason}</p>
                </div>
              </CardContent>
            </Card>

            {/* Evidence */}
            {selectedAppeal.evidence && selectedAppeal.evidence.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Evidence Files ({selectedAppeal.evidence.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {selectedAppeal.evidence.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{file.filename}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(file.url, '_blank')}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Review Decision */}
            <Card>
              <CardHeader>
                <CardTitle>Review Decision</CardTitle>
                <CardDescription>
                  Approve or reject this appeal with your review notes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Review Notes</label>
                  <Textarea
                    placeholder="Provide your review notes and decision reasoning..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                  <div className="text-xs text-muted-foreground mt-2">
                    {reviewNotes.length} / 1000 characters
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your decision will be sent to the boutique via email. Be professional and clear.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={handleApproveAppeal}
                    disabled={isSubmitting || !reviewNotes.trim()}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve Appeal
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1 gap-2"
                    onClick={handleRejectAppeal}
                    disabled={isSubmitting || !reviewNotes.trim()}
                  >
                    <XCircle className="w-4 h-4" />
                    Reject Appeal
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h2 className="text-lg font-bold mb-2">No Appeal Selected</h2>
              <p className="text-muted-foreground">
                Select an appeal from the list to review its details
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
