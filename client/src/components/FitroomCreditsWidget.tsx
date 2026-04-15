import { useEffect, useState } from "react";
import { AlertCircle, Zap } from "lucide-react";

interface CreditsData {
  remaining: number;
  total: number;
  used: number;
  percentage: number;
}

export function FitroomCreditsWidget() {  // Remove apiKey prop
  const [credits, setCredits] = useState<CreditsData | null>(null);
  const [isLow, setIsLow] = useState(false);
  const [isCritical, setIsCritical] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        setLoading(true);
        setError(null);

        // tRPC query should be GET
        const response = await fetch("/api/trpc/fitroom.getCredits", {
          method: "GET",
        });

        const data = await response.json();

        if (data.result?.data?.success) {
          const creditsData = data.result.data.credits;
          setCredits(creditsData);
          setIsLow(data.result.data.isLow);
          setIsCritical(data.result.data.isCritical);
        } else {
          setError("Failed to fetch credits");
        }
      } catch (err) {
        console.error("Error fetching Fitroom credits:", err);
        setError("Error fetching credits");
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();
    // Refresh every 5 minutes
    const interval = setInterval(fetchCredits, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []); // No dependencies


  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100">
        <div className="h-4 w-4 bg-gray-300 rounded animate-pulse" />
        <span className="text-sm text-gray-600">Loading...</span>
      </div>
    );
  }

  if (error || !credits) {
    return null;
  }

  const getColorClass = () => {
    if (isCritical) return "bg-red-100 text-red-700 border-red-300";
    if (isLow) return "bg-yellow-100 text-yellow-700 border-yellow-300";
    return "bg-green-100 text-green-700 border-green-300";
  };

  const getIcon = () => {
    if (isCritical) return <AlertCircle className="w-4 h-4" />;
    return <Zap className="w-4 h-4" />;
  };

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getColorClass()}`}
      title={`Fitroom: ${credits.remaining}/${credits.total} credits remaining`}
    >
      {getIcon()}
      <span className="text-sm font-medium">
        {credits.remaining.toLocaleString()} credits
      </span>
      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${
            isCritical ? "bg-red-500" : isLow ? "bg-yellow-500" : "bg-green-500"
          }`}
          style={{ width: `${Math.min(credits.percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
