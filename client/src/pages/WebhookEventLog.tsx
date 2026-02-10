import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Search, Filter, Download } from "lucide-react";

/**
 * WebhookEventLog component displays API events and webhook logs.
 * Retailers can filter by event type, search by details, and view event history.
 */
export default function WebhookEventLog() {
  const [eventType, setEventType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  // Mock webhook events data
  const mockEvents = [
    {
      id: 1,
      type: "try-on",
      endpoint: "/api/try-on",
      status: "success",
      statusCode: 200,
      timestamp: "2026-02-10 12:45:30",
      responseTime: "245ms",
      details: "Virtual try-on generated successfully",
    },
    {
      id: 2,
      type: "try-on",
      endpoint: "/api/try-on",
      status: "success",
      statusCode: 200,
      timestamp: "2026-02-10 12:44:15",
      responseTime: "189ms",
      details: "Virtual try-on generated successfully",
    },
    {
      id: 3,
      type: "error",
      endpoint: "/api/try-on",
      status: "error",
      statusCode: 500,
      timestamp: "2026-02-10 12:43:00",
      responseTime: "1200ms",
      details: "Internal server error - timeout",
    },
    {
      id: 4,
      type: "rate-limit",
      endpoint: "/api/try-on",
      status: "rate-limited",
      statusCode: 429,
      timestamp: "2026-02-10 12:42:45",
      responseTime: "50ms",
      details: "Rate limit exceeded (100 req/min)",
    },
    {
      id: 5,
      type: "try-on",
      endpoint: "/api/widget",
      status: "success",
      statusCode: 200,
      timestamp: "2026-02-10 12:41:30",
      responseTime: "56ms",
      details: "Widget loaded successfully",
    },
  ];

  // Filter events
  const filteredEvents = mockEvents.filter((event) => {
    const matchesType = eventType === "all" || event.type === eventType;
    const matchesSearch =
      searchQuery === "" ||
      event.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.endpoint.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800";
      case "error":
        return "bg-red-100 text-red-800";
      case "rate-limited":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "try-on":
        return "bg-blue-100 text-blue-800";
      case "error":
        return "bg-red-100 text-red-800";
      case "rate-limit":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Webhook Event Log</h1>
            <p className="text-muted-foreground mt-1">
              Monitor and debug API events and webhook deliveries
            </p>
          </div>
          <Button className="gap-2">
            <Download className="w-4 h-4" />
            Export Logs
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Event Type Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Event Type</label>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="try-on">Try-On Requests</SelectItem>
                    <SelectItem value="error">Errors</SelectItem>
                    <SelectItem value="rate-limit">Rate Limit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by endpoint or details..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Time Range (Placeholder) */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Time Range</label>
                <Select defaultValue="24h">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">Last Hour</SelectItem>
                    <SelectItem value="24h">Last 24 Hours</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Event Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockEvents.length}</div>
              <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">80%</div>
              <p className="text-xs text-muted-foreground">4 of 5 succeeded</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Errors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">1</div>
              <p className="text-xs text-muted-foreground">1 error event</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">348ms</div>
              <p className="text-xs text-muted-foreground">Average time</p>
            </CardContent>
          </Card>
        </div>

        {/* Events Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Response Time</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <Badge className={getTypeBadgeColor(event.type)}>
                          {event.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {event.endpoint}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusBadgeColor(event.status)}>
                            {event.statusCode}
                          </Badge>
                          <span className="text-sm">{event.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>{event.responseTime}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {event.timestamp}
                      </TableCell>
                      <TableCell className="text-sm">{event.details}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredEvents.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No events found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Showing {filteredEvents.length} of {mockEvents.length} events
          </p>
          <div className="flex gap-2">
            <Button variant="outline" disabled={page === 1}>
              Previous
            </Button>
            <Button variant="outline">Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
