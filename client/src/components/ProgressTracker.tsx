import { Check, Loader2, AlertCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export interface ProgressStep {
  id: string;
  label: string;
  status: "pending" | "in-progress" | "completed" | "error";
  estimatedTime?: number; // in seconds
  elapsedTime?: number; // in seconds
}

interface ProgressTrackerProps {
  steps: ProgressStep[];
  currentStep?: string;
  overallProgress?: number; // 0-100
  estimatedTimeRemaining?: number; // in seconds
}

export function ProgressTracker({
  steps,
  currentStep,
  overallProgress = 0,
  estimatedTimeRemaining,
}: ProgressTrackerProps) {
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    return `${Math.round(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  };

  const getStepIcon = (step: ProgressStep) => {
    switch (step.status) {
      case "completed":
        return <Check className="w-5 h-5 text-green-600" />;
      case "in-progress":
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStepColor = (step: ProgressStep) => {
    switch (step.status) {
      case "completed":
        return "bg-green-50 border-green-200";
      case "in-progress":
        return "bg-blue-50 border-blue-200";
      case "error":
        return "bg-red-50 border-red-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  return (
    <Card className="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Overall Progress Bar */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-gray-900">Try-On Generation Progress</h3>
              <span className="text-sm font-medium text-gray-600">{overallProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          {/* Time Remaining */}
          {estimatedTimeRemaining && estimatedTimeRemaining > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-white rounded-lg p-3 border border-gray-200">
              <Clock className="w-4 h-4" />
              <span>Estimated time remaining: <strong>{formatTime(estimatedTimeRemaining)}</strong></span>
            </div>
          )}

          {/* Steps */}
          <div className="space-y-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${getStepColor(
                  step
                )}`}
              >
                <div className="flex-shrink-0">{getStepIcon(step)}</div>
                <div className="flex-grow">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">{step.label}</span>
                    {step.elapsedTime && (
                      <span className="text-xs text-gray-500">
                        {formatTime(step.elapsedTime)}
                      </span>
                    )}
                  </div>
                  {step.status === "in-progress" && step.estimatedTime && (
                    <div className="text-xs text-gray-500 mt-1">
                      Est. {formatTime(step.estimatedTime)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Completion Message */}
          {steps.every((s) => s.status === "completed") && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <p className="text-sm font-medium text-green-800">✓ Try-on generation complete!</p>
            </div>
          )}

          {/* Error Message */}
          {steps.some((s) => s.status === "error") && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
              <p className="text-sm font-medium text-red-800">✗ An error occurred during processing</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
