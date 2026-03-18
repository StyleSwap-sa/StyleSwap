import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Bell, Trash2, Plus } from "lucide-react";

/**
 * AlertConfiguration component allows retailers to set up alerts for API usage.
 * Supports alerts for error rates, rate limit warnings, and custom thresholds.
 */
export default function AlertConfiguration() {
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      name: "High Error Rate",
      type: "error_rate",
      threshold: 5,
      unit: "%",
      enabled: true,
      notificationChannels: ["email"],
    },
    {
      id: 2,
      name: "Rate Limit Warning",
      type: "rate_limit",
      threshold: 80,
      unit: "%",
      enabled: true,
      notificationChannels: ["email", "in-app"],
    },
    {
      id: 3,
      name: "Response Time Alert",
      type: "response_time",
      threshold: 500,
      unit: "ms",
      enabled: false,
      notificationChannels: ["email"],
    },
  ]);

  const [showNewAlert, setShowNewAlert] = useState(false);
  const [newAlert, setNewAlert] = useState({
    name: "",
    type: "error_rate",
    threshold: 5,
    notificationChannels: ["email"],
  });

  const handleAddAlert = () => {
    if (newAlert.name && newAlert.threshold) {
      const alert = {
        id: Math.max(...alerts.map((a) => a.id), 0) + 1,
        ...newAlert,
        unit: newAlert.type === "response_time" ? "ms" : "%",
        enabled: true,
      };
      setAlerts([...alerts, alert]);
      setNewAlert({
        name: "",
        type: "error_rate",
        threshold: 5,
        notificationChannels: ["email"],
      });
      setShowNewAlert(false);
    }
  };

  const handleDeleteAlert = (id: number) => {
    setAlerts(alerts.filter((a) => a.id !== id));
  };

  const handleToggleAlert = (id: number) => {
    setAlerts(
      alerts.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
    );
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case "error_rate":
        return "Error Rate";
      case "rate_limit":
        return "Rate Limit";
      case "response_time":
        return "Response Time";
      default:
        return type;
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Alert Configuration</h1>
            <p className="text-muted-foreground mt-1">
              Set up alerts to monitor your API performance and usage
            </p>
          </div>
          <Button onClick={() => setShowNewAlert(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            New Alert
          </Button>
        </div>

        {/* Alert Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {alerts.filter((a) => a.enabled).length}
              </div>
              <p className="text-xs text-muted-foreground">
                {alerts.length} total alerts configured
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Notification Channels
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">
                Email and in-app notifications
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Last Alert Triggered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2h ago</div>
              <p className="text-xs text-muted-foreground">
                Rate limit warning triggered
              </p>
            </CardContent>
          </Card>
        </div>

        {/* New Alert Form */}
        {showNewAlert && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-lg">Create New Alert</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="alert-name">Alert Name</Label>
                  <Input
                    id="alert-name"
                    placeholder="e.g., Critical Error Rate"
                    value={newAlert.name}
                    onChange={(e) =>
                      setNewAlert({ ...newAlert, name: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alert-type">Alert Type</Label>
                  <Select
                    value={newAlert.type}
                    onValueChange={(value) =>
                      setNewAlert({ ...newAlert, type: value })
                    }
                  >
                    <SelectTrigger id="alert-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="error_rate">Error Rate</SelectItem>
                      <SelectItem value="rate_limit">Rate Limit</SelectItem>
                      <SelectItem value="response_time">Response Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="threshold">
                    Threshold (
                    {newAlert.type === "response_time" ? "ms" : "%"})
                  </Label>
                  <Input
                    id="threshold"
                    type="number"
                    placeholder="e.g., 5"
                    value={newAlert.threshold}
                    onChange={(e) =>
                      setNewAlert({
                        ...newAlert,
                        threshold: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="channels">Notification Channels</Label>
                  <Select
                    value={newAlert.notificationChannels[0]}
                    onValueChange={(value) =>
                      setNewAlert({
                        ...newAlert,
                        notificationChannels: [value],
                      })
                    }
                  >
                    <SelectTrigger id="channels">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="in-app">In-App</SelectItem>
                      <SelectItem value="webhook">Webhook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowNewAlert(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddAlert}>Create Alert</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alerts Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configured Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alert Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Threshold</TableHead>
                    <TableHead>Channels</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.map((alert) => (
                    <TableRow key={alert.id}>
                      <TableCell className="font-medium">{alert.name}</TableCell>
                      <TableCell>{getAlertTypeLabel(alert.type)}</TableCell>
                      <TableCell>
                        {alert.threshold}
                        {alert.unit}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {alert.notificationChannels.map((channel) => (
                            <Badge key={channel} variant="secondary">
                              {channel}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            alert.enabled
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {alert.enabled ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleAlert(alert.id)}
                          >
                            {alert.enabled ? "Disable" : "Enable"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAlert(alert.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Alert History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Alert Triggers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  id: 1,
                  alert: "Rate Limit Warning",
                  message: "Rate limit usage reached 82%",
                  time: "2 hours ago",
                  severity: "warning",
                },
                {
                  id: 2,
                  alert: "High Error Rate",
                  message: "Error rate exceeded 5% threshold",
                  time: "5 hours ago",
                  severity: "error",
                },
              ].map((trigger) => (
                <div
                  key={trigger.id}
                  className="flex items-start gap-4 p-4 border rounded-lg"
                >
                  <Bell
                    className={`w-5 h-5 mt-1 ${
                      trigger.severity === "error"
                        ? "text-red-600"
                        : "text-yellow-600"
                    }`}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{trigger.alert}</p>
                    <p className="text-sm text-muted-foreground">
                      {trigger.message}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">{trigger.time}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
