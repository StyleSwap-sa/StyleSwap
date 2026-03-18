import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";

interface Webhook {
  id: string;
  url: string;
  events: string[];
  status: "active" | "inactive" | "failed";
  lastTriggered?: string;
  failureCount?: number;
}

interface WebhookManagementProps {
  webhooks: Webhook[];
  onAddWebhook?: (url: string, events: string[]) => void;
  onDeleteWebhook?: (id: string) => void;
  onTestWebhook?: (id: string) => void;
}

const AVAILABLE_EVENTS = [
  { id: "try_on.created", label: "Try-On Created" },
  { id: "try_on.completed", label: "Try-On Completed" },
  { id: "try_on.failed", label: "Try-On Failed" },
  { id: "order.created", label: "Order Created" },
  { id: "order.completed", label: "Order Completed" },
  { id: "credit.deducted", label: "Credit Deducted" },
];

export function WebhookManagement({
  webhooks,
  onAddWebhook,
  onDeleteWebhook,
  onTestWebhook,
}: WebhookManagementProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const handleAddWebhook = () => {
    if (!newUrl.trim()) {
      toast.error("Please enter a webhook URL");
      return;
    }
    if (selectedEvents.length === 0) {
      toast.error("Please select at least one event");
      return;
    }

    onAddWebhook?.(newUrl, selectedEvents);
    setNewUrl("");
    setSelectedEvents([]);
    setShowAddForm(false);
    toast.success("Webhook added successfully");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Webhook Management</CardTitle>
          <Button
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Webhook
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Webhook Form */}
          {showAddForm && (
            <div className="border border-border rounded-lg p-4 space-y-4">
              <div>
                <label className="text-sm font-medium">Webhook URL</label>
                <input
                  type="url"
                  placeholder="https://example.com/webhooks/styleswap"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full px-3 py-2 mt-2 border border-border rounded-md"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Events</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {AVAILABLE_EVENTS.map((event) => (
                    <label
                      key={event.id}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(event.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedEvents([...selectedEvents, event.id]);
                          } else {
                            setSelectedEvents(
                              selectedEvents.filter((id) => id !== event.id)
                            );
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{event.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddWebhook} className="flex-1">
                  Add Webhook
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Webhooks List */}
          {webhooks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No webhooks configured yet</p>
              <p className="text-sm">Add your first webhook to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className="border border-border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(webhook.status)}
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {webhook.url}
                        </code>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {webhook.events.map((event) => (
                          <span
                            key={event}
                            className="text-xs bg-primary/10 text-primary px-2 py-1 rounded"
                          >
                            {event}
                          </span>
                        ))}
                      </div>
                      {webhook.lastTriggered && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Last triggered: {webhook.lastTriggered}
                        </p>
                      )}
                      {webhook.failureCount && webhook.failureCount > 0 && (
                        <p className="text-xs text-red-500 mt-1">
                          {webhook.failureCount} recent failures
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onTestWebhook?.(webhook.id)}
                      >
                        Test
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          onDeleteWebhook?.(webhook.id);
                          toast.success("Webhook deleted");
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t pt-4 mt-4">
            <h4 className="text-sm font-medium mb-2">Webhook Documentation</h4>
            <p className="text-xs text-muted-foreground">
              Webhooks allow you to receive real-time notifications about events
              in your StyleSwap account. Each webhook will receive a POST request
              with event data in JSON format.
            </p>
            <a
              href="/api-docs"
              className="text-xs text-primary hover:underline mt-2 inline-block"
            >
              View webhook documentation →
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
