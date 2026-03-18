import React from 'react';
import {
  Shield,
  CheckCircle2,
  AlertCircle,
  Star,
  TrendingUp,
  Award,
  Clock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * Boutique Trust Indicators Component
 * Displays verification status, trust score, and customer confidence metrics
 * Used on boutique listings, product pages, and profiles
 */

interface BoutiqueTrustIndicatorsProps {
  boutique: {
    id: number;
    name: string;
    verificationStatus: 'approved' | 'pending' | 'rejected' | 'not_started';
    trustScore: number;
    totalReviews: number;
    averageRating: number;
    totalTransactions: number;
    refundRate: number;
    chargebackRate: number;
    verifiedAt?: string;
    expiresAt?: string;
  };
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export function BoutiqueTrustIndicators({
  boutique,
  size = 'md',
  showDetails = true,
}: BoutiqueTrustIndicatorsProps) {
  const getTrustColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrustLabel = (score: number) => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'At Risk';
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={`space-y-3 ${sizeClasses[size]}`}>
      {/* Verification Badge */}
      {boutique.verificationStatus === 'approved' && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200 cursor-help">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span className="font-medium text-green-900">Verified Boutique</span>
              <Award className="w-4 h-4 text-green-600 ml-auto flex-shrink-0" />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>This boutique has been verified by StyleSwap</p>
            {boutique.verifiedAt && (
              <p className="text-xs">Verified on {new Date(boutique.verifiedAt).toLocaleDateString()}</p>
            )}
          </TooltipContent>
        </Tooltip>
      )}

      {boutique.verificationStatus === 'pending' && (
        <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
          <Clock className="w-4 h-4 text-yellow-600 flex-shrink-0" />
          <span className="font-medium text-yellow-900">Verification Pending</span>
        </div>
      )}

      {boutique.verificationStatus === 'rejected' && (
        <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg border border-red-200">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span className="font-medium text-red-900">Verification Rejected</span>
        </div>
      )}

      {showDetails && (
        <div className="grid grid-cols-2 gap-2">
          {/* Trust Score */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="cursor-help">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className={`w-4 h-4 ${getTrustColor(boutique.trustScore)}`} />
                    <span className="text-xs text-muted-foreground">Trust Score</span>
                  </div>
                  <div className={`text-lg font-bold ${getTrustColor(boutique.trustScore)}`}>
                    {boutique.trustScore}/100
                  </div>
                  <div className="text-xs text-muted-foreground">{getTrustLabel(boutique.trustScore)}</div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Based on verification status, transaction history, and customer reviews</p>
            </TooltipContent>
          </Tooltip>

          {/* Customer Rating */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="cursor-help">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs text-muted-foreground">Rating</span>
                  </div>
                  <div className="text-lg font-bold">{boutique.averageRating.toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground">
                    {boutique.totalReviews} reviews
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Average rating from {boutique.totalReviews} customer reviews</p>
            </TooltipContent>
          </Tooltip>

          {/* Transaction Count */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="cursor-help">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span className="text-xs text-muted-foreground">Transactions</span>
                  </div>
                  <div className="text-lg font-bold">{boutique.totalTransactions}</div>
                  <div className="text-xs text-muted-foreground">completed</div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Total number of completed transactions</p>
            </TooltipContent>
          </Tooltip>

          {/* Refund Rate */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Card className="cursor-help">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    <span className="text-xs text-muted-foreground">Refund Rate</span>
                  </div>
                  <div className="text-lg font-bold">{(boutique.refundRate * 100).toFixed(1)}%</div>
                  <div className="text-xs text-muted-foreground">
                    {boutique.refundRate < 0.05 ? 'Excellent' : 'Monitor'}
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>Percentage of transactions resulting in refunds</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Verification Expiry Warning */}
      {boutique.verificationStatus === 'approved' && boutique.expiresAt && (
        <div className="text-xs text-muted-foreground p-2 bg-gray-50 rounded">
          Verification expires {new Date(boutique.expiresAt).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}

/**
 * Compact Verification Badge
 * Used for inline display on product cards and listings
 */
export function VerificationBadge({ status, trustScore }: { status: string; trustScore: number }) {
  if (status !== 'approved') return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full cursor-help">
          <CheckCircle2 className="w-3 h-3" />
          <span className="text-xs font-medium">Verified</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>Verified boutique with {trustScore}/100 trust score</p>
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Trust Score Indicator Bar
 * Visual representation of trust score
 */
export function TrustScoreBar({ score, showLabel = true }: { score: number; showLabel?: boolean }) {
  const getColor = (score: number) => {
    if (score >= 85) return 'bg-green-500';
    if (score >= 70) return 'bg-blue-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-1">
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full ${getColor(score)} transition-all`}
          style={{ width: `${score}%` }}
        />
      </div>
      {showLabel && (
        <div className="text-xs text-muted-foreground text-right">{score}/100</div>
      )}
    </div>
  );
}

/**
 * Customer Confidence Score
 * Composite score based on multiple factors
 */
export function CustomerConfidenceScore({
  boutique,
}: {
  boutique: BoutiqueTrustIndicatorsProps['boutique'];
}) {
  // Calculate confidence score (0-100)
  const verificationBonus = boutique.verificationStatus === 'approved' ? 30 : 0;
  const ratingScore = Math.min(boutique.averageRating * 20, 25);
  const transactionScore = Math.min(boutique.totalTransactions / 100, 20);
  const refundScore = Math.max(20 - boutique.refundRate * 200, 0);

  const totalScore = Math.round(
    verificationBonus + ratingScore + transactionScore + refundScore
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-2 cursor-help">
          <div className="text-sm font-bold">{totalScore}%</div>
          <div className="flex-1">
            <div className="w-24 bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  totalScore >= 80
                    ? 'bg-green-500'
                    : totalScore >= 60
                      ? 'bg-blue-500'
                      : totalScore >= 40
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                }`}
                style={{ width: `${totalScore}%` }}
              />
            </div>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium mb-2">Customer Confidence Score</p>
        <div className="text-xs space-y-1">
          <p>Verification: {verificationBonus} pts</p>
          <p>Rating: {Math.round(ratingScore)} pts</p>
          <p>Transactions: {Math.round(transactionScore)} pts</p>
          <p>Refund Rate: {Math.round(refundScore)} pts</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
