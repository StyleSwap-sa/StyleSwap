import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Clock,
  Send,
  Settings,
  CheckCircle,
  AlertCircle,
  RotateCcw,
} from "lucide-react";

type Frequency = "daily" | "weekly" | "monthly";
type AlertLevel = "80" | "50" | "20" | "10";

interface SchedulerConfig {
  frequency: Frequency;
  sendTime: string;
  thresholds: {
    critical: boolean; // 80%
    warning: boolean; // 50%
    notice: boolean; // 20%
    info: boolean; // 10%
  };
}

interface AlertHistory {
  id: string;
  timestamp: string;
  boutique: string;
  level: string;
  status: "sent" | "failed" | "pending";
}

export function SchedulerControls() {
  const [config, setConfig] = useState<SchedulerConfig>({
    frequency: "daily",
    sendTime: "09:00",
    thresholds: {
      critical: true,
      warning: true,
      notice: true,
      info: false,
    },
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [isSendingNow, setIsSendingNow] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Sample alert history
  const alertHistory: AlertHistory[] = [
    {
      id: "1",
      timestamp: "2026-01-22 09:00",
      boutique: "Luxury Boutique",
      level: "Critical (80%)",
      status: "sent",
    },
    {
      id: "2",
      timestamp: "2026-01-22 09:05",
      boutique: "Urban Fashion Co",
      level: "Warning (50%)",
      status: "sent",
    },
    {
      id: "3",
      timestamp: "2026-01-21 09:00",
      boutique: "Vintage Threads",
      level: "Notice (20%)",
      status: "sent",
    },
    {
      id: "4",
      timestamp: "2026-01-20 09:00",
      boutique: "Elegant Styles",
      level: "Critical (80%)",
      status: "failed",
    },
  ];

  const handleFrequencyChange = (value: Frequency) => {
    setConfig({ ...config, frequency: value });
  };

  const handleTimeChange = (value: string) => {
    setConfig({ ...config, sendTime: value });
  };

  const handleThresholdToggle = (level: keyof typeof config.thresholds) => {
    setConfig({
      ...config,
      thresholds: {
        ...config.thresholds,
        [level]: !config.thresholds[level],
      },
    });
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    setSaveStatus("idle");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // In a real implementation, this would call the tRPC procedure
      // await trpc.admin.updateAlertSchedulerConfig.mutate(config);

      setSaveStatus("success");

      // Reset status after 3 seconds
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("Failed to save config:", error);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendNow = async () => {
    setIsSendingNow(true);

    try {
      // Simulate sending alerts
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // In a real implementation, this would call the tRPC procedure
      // await trpc.admin.sendCreditAlertsNow.mutate();

      setSaveStatus("success");

      // Reset status after 3 seconds
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("Failed to send alerts:", error);
      setSaveStatus("error");
    } finally {
      setIsSendingNow(false);
    }
  };

  const handleReset = () => {
    setConfig({
      frequency: "daily",
      sendTime: "09:00",
      thresholds: {
        critical: true,
        warning: true,
        notice: true,
        info: false,
      },
    });
    setSaveStatus("idle");
  };

  const getFrequencyLabel = () => {
    switch (config.frequency) {
      case "daily":
        return "Every day";
      case "weekly":
        return "Every Monday";
      case "monthly":
        return "First day of month";
      default:
        return config.frequency;
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Alert Scheduler Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Frequency Selection */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Alert Frequency
            </label>
            <Select value={config.frequency} onValueChange={handleFrequencyChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">
              Alerts will be sent {getFrequencyLabel()}
            </p>
          </div>

          {/* Send Time Selection */}
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Send Time (24-hour format)
            </label>
            <Input
              type="time"
              value={config.sendTime}
              onChange={(e) => handleTimeChange(e.target.value)}
              className="max-w-xs"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Alerts will be sent at {config.sendTime} every {config.frequency}
            </p>
          </div>

          {/* Alert Thresholds */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-semibold mb-4">Alert Thresholds</h3>
            <div className="space-y-3">
              {/* Critical Threshold (80%) */}
              <div className="flex items-center justify-between p-3 border rounded-lg bg-red-50">
                <div>
                  <p className="font-medium text-red-900">Critical</p>
                  <p className="text-sm text-red-700">When credits reach 80% usage</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.thresholds.critical}
                  onChange={() => handleThresholdToggle("critical")}
                  className="w-5 h-5 rounded border-red-300 text-red-600"
                />
              </div>

              {/* Warning Threshold (50%) */}
              <div className="flex items-center justify-between p-3 border rounded-lg bg-orange-50">
                <div>
                  <p className="font-medium text-orange-900">Warning</p>
                  <p className="text-sm text-orange-700">When credits reach 50% usage</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.thresholds.warning}
                  onChange={() => handleThresholdToggle("warning")}
                  className="w-5 h-5 rounded border-orange-300 text-orange-600"
                />
              </div>

              {/* Notice Threshold (20%) */}
              <div className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50">
                <div>
                  <p className="font-medium text-yellow-900">Notice</p>
                  <p className="text-sm text-yellow-700">When credits reach 20% usage</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.thresholds.notice}
                  onChange={() => handleThresholdToggle("notice")}
                  className="w-5 h-5 rounded border-yellow-300 text-yellow-600"
                />
              </div>

              {/* Info Threshold (10%) */}
              <div className="flex items-center justify-between p-3 border rounded-lg bg-blue-50">
                <div>
                  <p className="font-medium text-blue-900">Info</p>
                  <p className="text-sm text-blue-700">When credits reach 10% usage</p>
                </div>
                <input
                  type="checkbox"
                  checked={config.thresholds.info}
                  onChange={() => handleThresholdToggle("info")}
                  className="w-5 h-5 rounded border-blue-300 text-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {saveStatus === "success" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Configuration saved!</p>
                <p className="text-sm text-green-700">Your scheduler settings have been updated successfully.</p>
              </div>
            </div>
          )}

          {saveStatus === "error" && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-medium text-red-900">Failed to save configuration</p>
                <p className="text-sm text-red-700">Please try again or contact support.</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleSaveConfig}
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? "Saving..." : "Save Configuration"}
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              className="flex-1"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Default
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Send Now Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">Send Alerts Now</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-blue-700 mb-4">
            Trigger an immediate alert check for all boutiques at the configured thresholds. This is useful for testing or urgent notifications.
          </p>
          <Button
            onClick={handleSendNow}
            disabled={isSendingNow}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4 mr-2" />
            {isSendingNow ? "Sending Alerts..." : "Send Alerts Now"}
          </Button>
        </CardContent>
      </Card>

      {/* Alert History Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Alert History</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? "Hide" : "Show"}
          </Button>
        </CardHeader>
        {showHistory && (
          <CardContent>
            <div className="space-y-2">
              {alertHistory.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{alert.boutique}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{alert.timestamp}</span>
                      <span className="text-xs font-medium text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{alert.level}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {alert.status === "sent" && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded text-green-700 text-xs font-medium">
                        <CheckCircle className="w-3 h-3" />
                        Sent
                      </div>
                    )}
                    {alert.status === "failed" && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-red-100 rounded text-red-700 text-xs font-medium">
                        <AlertCircle className="w-3 h-3" />
                        Failed
                      </div>
                    )}
                    {alert.status === "pending" && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 rounded text-yellow-700 text-xs font-medium">
                        <Clock className="w-3 h-3" />
                        Pending
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Configuration Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Frequency</p>
              <p className="text-sm font-semibold mt-1">{config.frequency}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Send Time</p>
              <p className="text-sm font-semibold mt-1">{config.sendTime}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Active Thresholds</p>
              <p className="text-sm font-semibold mt-1">
                {Object.values(config.thresholds).filter(Boolean).length}/4
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Status</p>
              <p className="text-sm font-semibold mt-1 text-green-600">Active</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
