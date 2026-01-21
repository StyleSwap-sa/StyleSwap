import { useEffect, useState } from "react";
import { AlertCircle, AlertTriangle, AlertOctagon, Info, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";

interface AlertBoutique {
  id: number;
  name: string;
  usagePercentage: number;
  remainingCredits: number;
  totalCredits: number;
  alertLevel: "80" | "50" | "20" | "10";
}

interface AlertGroup {
  level: "80" | "50" | "20" | "10";
  label: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
  boutiques: AlertBoutique[];
}

export function CreditAlertsCard() {
  const [alertGroups, setAlertGroups] = useState<AlertGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<"80" | "50" | "20" | "10" | null>(null);

  const checkAlertsQuery = trpc.admin.checkCreditAlerts.useQuery(undefined, {
    enabled: true,
    refetchInterval: 60000, // Refetch every minute
  });

  useEffect(() => {
    if (checkAlertsQuery.data) {
      const groups: AlertGroup[] = [
        {
          level: "80",
          label: "CRITICAL",
          color: "text-red-600",
          bgColor: "bg-red-50 border-red-200",
          icon: <AlertOctagon className="w-5 h-5 text-red-600" />,
          boutiques: checkAlertsQuery.data.alerts80 || [],
        },
        {
          level: "50",
          label: "WARNING",
          color: "text-orange-600",
          bgColor: "bg-orange-50 border-orange-200",
          icon: <AlertTriangle className="w-5 h-5 text-orange-600" />,
          boutiques: checkAlertsQuery.data.alerts50 || [],
        },
        {
          level: "20",
          label: "NOTICE",
          color: "text-yellow-600",
          bgColor: "bg-yellow-50 border-yellow-200",
          icon: <AlertCircle className="w-5 h-5 text-yellow-600" />,
          boutiques: checkAlertsQuery.data.alerts20 || [],
        },
        {
          level: "10",
          label: "INFO",
          color: "text-blue-600",
          bgColor: "bg-blue-50 border-blue-200",
          icon: <Info className="w-5 h-5 text-blue-600" />,
          boutiques: checkAlertsQuery.data.alerts10 || [],
        },
      ];

      setAlertGroups(groups);
      setIsLoading(false);
    }
  }, [checkAlertsQuery.data]);

  const getTotalBoutiquesAtRisk = () => {
    return alertGroups.reduce((sum, group) => sum + group.boutiques.length, 0);
  };

  const renderAlertGroup = (group: AlertGroup) => {
    if (group.boutiques.length === 0) return null;

    return (
      <div key={group.level} className={`border rounded-lg p-4 ${group.bgColor}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {group.icon}
            <h3 className={`font-bold text-sm ${group.color}`}>{group.label}</h3>
            <Badge variant="secondary">{group.boutiques.length}</Badge>
          </div>
        </div>

        <div className="space-y-2">
          {group.boutiques.map((boutique) => (
            <div
              key={boutique.id}
              className="flex items-center justify-between bg-white p-3 rounded border border-gray-200 hover:shadow-sm transition-shadow"
            >
              <div className="flex-1">
                <p className="font-medium text-sm text-gray-900">{boutique.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-xs">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        group.level === "80"
                          ? "bg-red-600"
                          : group.level === "50"
                            ? "bg-orange-600"
                            : group.level === "20"
                              ? "bg-yellow-600"
                              : "bg-blue-600"
                      }`}
                      style={{ width: `${boutique.usagePercentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-600 font-medium w-12">
                    {boutique.usagePercentage}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {boutique.remainingCredits} / {boutique.totalCredits} credits remaining
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="ml-2 whitespace-nowrap"
                onClick={() => {
                  // TODO: Navigate to purchase credits flow
                  console.log(`Purchase credits for boutique ${boutique.id}`);
                }}
              >
                Buy Credits
              </Button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            Credit Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">Loading alerts...</div>
        </CardContent>
      </Card>
    );
  }

  if (getTotalBoutiquesAtRisk() === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            Credit Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-green-600 font-medium">All boutiques are healthy</div>
            <p className="text-gray-500 text-sm mt-2">No credit alerts at this time</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            Credit Alerts
          </CardTitle>
          <Badge variant="destructive">{getTotalBoutiquesAtRisk()} boutiques at risk</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alertGroups.map((group) => renderAlertGroup(group))}

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-4 gap-4">
              {alertGroups.map((group) => (
                <div key={group.level} className="text-center">
                  <div className={`text-2xl font-bold ${group.color}`}>
                    {group.boutiques.length}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">{group.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // TODO: Navigate to send alerts page
                console.log("Send alerts");
              }}
            >
              Send Alerts Now
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // TODO: Navigate to full alerts page
                console.log("View all alerts");
              }}
            >
              View Detailed Report
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
