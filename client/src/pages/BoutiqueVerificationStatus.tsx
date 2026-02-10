import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Shield,
  TrendingUp,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';

/**
 * Boutique Verification Status Dashboard
 * Shows current verification status, trust score, and next steps
 */

export default function BoutiqueVerificationStatus() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('status');

  // Fetch verification status
  const { data: verificationStatus, isLoading } = trpc.verification.getVerificationStatus.useQuery(
    { boutiqueId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  // Fetch trust score details
  const { data: trustScoreDetails } = trpc.verification.getTrustScoreDetails.useQuery(
    { boutiqueId: user?.id || 0 },
    { enabled: !!user?.id }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p>Loading verification status...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'rejected':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="w-6 h-6 text-green-600" />;
      case 'pending':
        return <Clock className="w-6 h-6 text-yellow-600" />;
      case 'rejected':
        return <AlertTriangle className="w-6 h-6 text-red-600" />;
      default:
        return <AlertCircle className="w-6 h-6 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/5 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2">Verification Status</h1>
          <p className="text-muted-foreground">
            Monitor your boutique verification and trust score
          </p>
        </div>

        {/* Main Status Card */}
        {verificationStatus && (
          <Card className="border-2">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {getStatusIcon(verificationStatus.status)}
                  <div>
                    <CardTitle className={getStatusColor(verificationStatus.status)}>
                      {verificationStatus.status === 'approved' && 'Verified & Approved'}
                      {verificationStatus.status === 'pending' && 'Verification Pending'}
                      {verificationStatus.status === 'rejected' && 'Verification Rejected'}
                      {verificationStatus.status === 'not_started' && 'Not Started'}
                    </CardTitle>
                    <CardDescription>
                      {verificationStatus.status === 'approved' &&
                        `Approved on ${new Date(verificationStatus.approvedAt).toLocaleDateString()}`}
                      {verificationStatus.status === 'pending' &&
                        `Submitted on ${new Date(verificationStatus.submittedAt).toLocaleDateString()}`}
                      {verificationStatus.status === 'rejected' &&
                        `Rejected on ${new Date(verificationStatus.rejectedAt).toLocaleDateString()}`}
                    </CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary">
                    {verificationStatus.trustScore}/100
                  </div>
                  <div className="text-sm text-muted-foreground">Trust Score</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {verificationStatus.status === 'approved' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-sm text-muted-foreground">Verification Type</div>
                      <div className="font-medium capitalize">
                        {verificationStatus.verificationType.replace('_', ' ')}
                      </div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-sm text-muted-foreground">Expires</div>
                      <div className="font-medium">
                        {new Date(verificationStatus.expiresAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-sm text-muted-foreground">Days Until Expiry</div>
                      <div className="font-medium">
                        {Math.ceil(
                          (new Date(verificationStatus.expiresAt).getTime() - Date.now()) /
                            (1000 * 60 * 60 * 24)
                        )}{' '}
                        days
                      </div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-sm text-muted-foreground">Badge Visibility</div>
                      <div className="font-medium">Public</div>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <div className="font-medium text-green-900">Verified Badge Active</div>
                        <div className="text-sm text-green-800">
                          Your boutique is displaying a verified badge to customers. This increases trust
                          and conversion rates.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {verificationStatus.status === 'pending' && (
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                      <div>
                        <div className="font-medium text-yellow-900">Under Review</div>
                        <div className="text-sm text-yellow-800">
                          Your verification application is being reviewed by our team. This typically takes
                          2-5 business days. We'll send you an email update once the review is complete.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium">Verification Progress</div>
                    <div className="space-y-2">
                      {verificationStatus.checks?.map((check: any) => (
                        <div key={check.id} className="flex items-center gap-3 p-2">
                          {check.status === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          ) : check.status === 'in_progress' ? (
                            <Clock className="w-4 h-4 text-yellow-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-gray-400" />
                          )}
                          <span className="text-sm">{check.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {verificationStatus.status === 'rejected' && (
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div>
                        <div className="font-medium text-red-900">Verification Rejected</div>
                        <div className="text-sm text-red-800">
                          {verificationStatus.rejectionReason}
                        </div>
                      </div>
                    </div>
                  </div>

                  {verificationStatus.adminNotes && (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-sm font-medium mb-2">Admin Notes</div>
                      <div className="text-sm text-muted-foreground">
                        {verificationStatus.adminNotes}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      You can reapply for verification after 30 days. Make sure to address the rejection
                      reason above.
                    </p>
                    <Button className="w-full">Appeal Decision</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="status">Status Details</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="score">Trust Score</TabsTrigger>
          </TabsList>

          {/* Status Details Tab */}
          <TabsContent value="status">
            <Card>
              <CardHeader>
                <CardTitle>Verification Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  {verificationStatus?.timeline?.map((event: any, idx: number) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 bg-primary rounded-full" />
                        {idx < (verificationStatus?.timeline?.length || 0) - 1 && (
                          <div className="w-0.5 h-12 bg-border" />
                        )}
                      </div>
                      <div className="pb-4">
                        <div className="font-medium">{event.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(event.timestamp).toLocaleString()}
                        </div>
                        {event.description && (
                          <div className="text-sm mt-1">{event.description}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Submitted Documents</CardTitle>
                <CardDescription>
                  Documents submitted for verification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {verificationStatus?.documents?.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 border border-border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-primary" />
                        <div>
                          <div className="font-medium text-sm">{doc.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(doc.uploadedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.status === 'approved' && (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        )}
                        {doc.status === 'pending' && (
                          <Clock className="w-4 h-4 text-yellow-600" />
                        )}
                        {doc.status === 'rejected' && (
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        )}
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trust Score Tab */}
          <TabsContent value="score">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Trust Score Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {trustScoreDetails?.factors?.map((factor: any) => (
                  <div key={factor.id}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium">{factor.name}</div>
                        <div className="text-sm text-muted-foreground">{factor.description}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{factor.score}</div>
                        <div className="text-xs text-muted-foreground">/{factor.maxScore}</div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${(factor.score / factor.maxScore) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}

                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium">How to Improve Your Score</div>
                      <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                        <li>• Process more transactions</li>
                        <li>• Maintain low refund rates</li>
                        <li>• Collect positive customer reviews</li>
                        <li>• Keep account in good standing</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {verificationStatus?.status === 'approved' && (
            <>
              <Button variant="outline" className="flex-1">
                Renew Verification
              </Button>
              <Button className="flex-1">View Public Profile</Button>
            </>
          )}
          {verificationStatus?.status === 'pending' && (
            <Button variant="outline" className="w-full">
              View Submitted Application
            </Button>
          )}
          {verificationStatus?.status === 'rejected' && (
            <Button className="w-full">Reapply for Verification</Button>
          )}
        </div>
      </div>
    </div>
  );
}
