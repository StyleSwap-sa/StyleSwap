import { Shield, CheckCircle2, AlertCircle, Clock, XCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Verification Badge Component
 * Displays boutique verification status with trust score and badge
 * Used on boutique profiles and listings
 */

export interface VerificationStatus {
  status: "pending" | "approved" | "rejected" | "suspended" | "expired";
  trustScore: number;
  riskScore: number;
  type: "formal_business" | "social_media";
  approvedAt?: string;
  expiresAt?: string;
}

interface VerificationBadgeProps {
  verification?: VerificationStatus | null;
  size?: "sm" | "md" | "lg";
  showScore?: boolean;
  showTooltip?: boolean;
}

export function VerificationBadge({
  verification,
  size = "md",
  showScore = true,
  showTooltip = true,
}: VerificationBadgeProps) {
  if (!verification) {
    return null;
  }

  const { status, trustScore, riskScore, type } = verification;

  // Determine badge appearance based on status and trust score
  const getBadgeConfig = () => {
    switch (status) {
      case "approved":
        if (trustScore >= 90) {
          return {
            icon: CheckCircle2,
            label: "Verified & Trusted",
            color: "text-green-600",
            bgColor: "bg-green-50",
            borderColor: "border-green-200",
            tooltip: "This boutique has been verified and has a high trust score",
          };
        } else if (trustScore >= 70) {
          return {
            icon: CheckCircle2,
            label: "Verified",
            color: "text-blue-600",
            bgColor: "bg-blue-50",
            borderColor: "border-blue-200",
            tooltip: "This boutique has been verified",
          };
        }
        break;
      case "pending":
        return {
          icon: Clock,
          label: "Verification Pending",
          color: "text-amber-600",
          bgColor: "bg-amber-50",
          borderColor: "border-amber-200",
          tooltip: "This boutique is currently under review",
        };
      case "rejected":
        return {
          icon: XCircle,
          label: "Verification Failed",
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          tooltip: "This boutique failed verification",
        };
      case "suspended":
        return {
          icon: AlertCircle,
          label: "Verification Suspended",
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          tooltip: "This boutique's verification has been suspended",
        };
      case "expired":
        return {
          icon: AlertCircle,
          label: "Verification Expired",
          color: "text-amber-600",
          bgColor: "bg-amber-50",
          borderColor: "border-amber-200",
          tooltip: "This boutique's verification has expired and needs renewal",
        };
      default:
        return {
          icon: Shield,
          label: "Unverified",
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          tooltip: "This boutique has not been verified",
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const badge = (
    <div
      className={`inline-flex items-center gap-2 rounded-full border ${config.borderColor} ${config.bgColor} ${sizeClasses[size]} ${config.color}`}
    >
      <Icon className={iconSizes[size]} />
      <span className="font-medium">{config.label}</span>
      {showScore && status === "approved" && (
        <span className="font-bold ml-1">{trustScore}/100</span>
      )}
    </div>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <p className="font-semibold">{config.tooltip}</p>
            <div className="text-xs space-y-1">
              <p>
                <span className="font-medium">Type:</span> {type === "formal_business" ? "Formal Business" : "Social Media Seller"}
              </p>
              <p>
                <span className="font-medium">Trust Score:</span> {trustScore}/100
              </p>
              <p>
                <span className="font-medium">Risk Score:</span> {riskScore}/100
              </p>
              {verification.approvedAt && (
                <p>
                  <span className="font-medium">Verified:</span>{" "}
                  {new Date(verification.approvedAt).toLocaleDateString()}
                </p>
              )}
              {verification.expiresAt && (
                <p>
                  <span className="font-medium">Expires:</span>{" "}
                  {new Date(verification.expiresAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Verification Details Card
 * Shows detailed verification information
 */
export function VerificationDetailsCard({ verification }: { verification: VerificationStatus }) {
  const { status, trustScore, riskScore, type, approvedAt, expiresAt } = verification;

  const getTrustLevel = (score: number) => {
    if (score >= 90) return { label: "Highly Trusted", color: "text-green-600" };
    if (score >= 70) return { label: "Trusted", color: "text-blue-600" };
    if (score >= 50) return { label: "Moderate", color: "text-amber-600" };
    return { label: "Low Trust", color: "text-red-600" };
  };

  const getRiskLevel = (score: number) => {
    if (score >= 70) return { label: "High Risk", color: "text-red-600" };
    if (score >= 50) return { label: "Medium Risk", color: "text-amber-600" };
    if (score >= 30) return { label: "Low Risk", color: "text-blue-600" };
    return { label: "Very Low Risk", color: "text-green-600" };
  };

  const trustLevel = getTrustLevel(trustScore);
  const riskLevel = getRiskLevel(riskScore);

  return (
    <div className="bg-secondary/50 rounded-lg p-6 space-y-4">
      <div>
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Verification Details
        </h3>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Status */}
        <div>
          <p className="text-sm text-muted-foreground mb-1">Status</p>
          <p className="font-semibold capitalize">{status}</p>
        </div>

        {/* Type */}
        <div>
          <p className="text-sm text-muted-foreground mb-1">Verification Type</p>
          <p className="font-semibold">{type === "formal_business" ? "Formal Business" : "Social Media Seller"}</p>
        </div>

        {/* Trust Score */}
        <div>
          <p className="text-sm text-muted-foreground mb-1">Trust Score</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-secondary rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ width: `${trustScore}%` }}
              />
            </div>
            <span className={`font-bold text-sm ${trustLevel.color}`}>
              {trustScore}/100 ({trustLevel.label})
            </span>
          </div>
        </div>

        {/* Risk Score */}
        <div>
          <p className="text-sm text-muted-foreground mb-1">Risk Score</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-secondary rounded-full h-2">
              <div
                className="bg-red-600 h-2 rounded-full transition-all"
                style={{ width: `${riskScore}%` }}
              />
            </div>
            <span className={`font-bold text-sm ${riskLevel.color}`}>
              {riskScore}/100 ({riskLevel.label})
            </span>
          </div>
        </div>
      </div>

      {/* Dates */}
      {(approvedAt || expiresAt) && (
        <div className="border-t pt-4 space-y-2">
          {approvedAt && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Verified On</span>
              <span className="font-medium">{new Date(approvedAt).toLocaleDateString()}</span>
            </div>
          )}
          {expiresAt && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Expires On</span>
              <span className="font-medium">{new Date(expiresAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      )}

      {/* Trust Score Breakdown */}
      <div className="border-t pt-4">
        <p className="text-sm font-semibold mb-3">Trust Score Breakdown</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Documents Verified</span>
            <span className="font-medium">40%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Account Age</span>
            <span className="font-medium">15%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Transaction History</span>
            <span className="font-medium">20%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Customer Reviews</span>
            <span className="font-medium">15%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Behavioral Patterns</span>
            <span className="font-medium">10%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Verification Status Indicator
 * Compact indicator for use in lists and tables
 */
export function VerificationStatusIndicator({ verification }: { verification: VerificationStatus }) {
  const { status, trustScore } = verification;

  const getIndicatorColor = () => {
    if (status === "approved" && trustScore >= 90) return "bg-green-500";
    if (status === "approved" && trustScore >= 70) return "bg-blue-500";
    if (status === "pending") return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${getIndicatorColor()}`} />
      <span className="text-sm font-medium capitalize">{status}</span>
    </div>
  );
}
