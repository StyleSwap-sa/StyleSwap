import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, DollarSign, CheckCircle } from "lucide-react";

export default function AdminAffiliates() {
  const [statusFilter, setStatusFilter] = useState<
    "pending" | "approved" | "rejected" | "suspended" | undefined
  >("pending");

  const { data: list, refetch } = trpc.affiliateAdmin.list.useQuery({
    status: statusFilter,
    limit: 100,
  });

  const approve = trpc.affiliateAdmin.approve.useMutation({ onSuccess: () => refetch() });
  const reject = trpc.affiliateAdmin.reject.useMutation({ onSuccess: () => refetch() });

  const { data: settings, refetch: refetchSettings } =
    trpc.affiliateAdmin.getSettings.useQuery();
  const update = trpc.affiliateAdmin.updateSettings.useMutation({
    onSuccess: () => refetchSettings(),
  });

  const [edit, setEdit] = useState<any>({});

  // --- Payout logic ---
  const [payoutAffiliateId, setPayoutAffiliateId] = useState<string>("");
  const [periodStart, setPeriodStart] = useState<string>("");
  const [periodEnd, setPeriodEnd] = useState<string>("");

  const { data: batches, isLoading: batchesLoading, refetch: refetchBatches } =
    trpc.affiliateAdmin.listPayoutBatches.useQuery();

  const generateBatch = trpc.affiliateAdmin.generatePayoutBatch.useMutation({
    onSuccess: () => {
      alert("Batch generated successfully!");
      refetchBatches();
    },
    onError: (err) => alert(err.message),
  });

  const markPaid = trpc.affiliateAdmin.markBatchPaid.useMutation({
    onSuccess: () => {
      alert("Batch marked as paid!");
      refetchBatches();
    },
    onError: (err) => alert(err.message),
  });

  if (!list) return <Loader2 className="w-6 h-6 animate-spin" />;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">Affiliate Administration</h1>

      {/* --- Applications Table --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Applications</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters — wrap on small screens */}
          <div className="flex flex-wrap gap-2 mb-4">
            {(["pending", "approved", "rejected", "suspended"] as const).map((s) => (
              <Button
                key={s}
                variant={statusFilter === s ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(s)}
              >
                {s}
              </Button>
            ))}
          </div>

          {list.length === 0 ? (
            <p className="text-sm text-muted-foreground">No records.</p>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-3 whitespace-nowrap">ID</th>
                    <th className="py-2 pr-3">Name</th>
                    <th className="py-2 pr-3 whitespace-nowrap">User</th>
                    <th className="py-2 pr-3 whitespace-nowrap">Applied</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((a: any) => (
                    <tr key={a.id} className="border-b align-top">
                      <td className="py-2 pr-3 whitespace-nowrap">{a.id}</td>
                      <td className="py-2 pr-3">{a.affiliateName}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{a.userId}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {new Date(a.appliedAt).toLocaleDateString()}
                      </td>
                      <td className="py-2 pr-3 capitalize">{a.status}</td>
                      <td className="py-2 pr-3">
                        {a.status === "pending" && (
                          <div className="flex flex-wrap gap-1">
                            <Button size="sm" onClick={() => approve.mutate({ affiliateId: a.id })}>
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                const reason = window.prompt("Rejection reason?");
                                if (reason) reject.mutate({ affiliateId: a.id, reason });
                              }}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- Settings Card --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {settings && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              {[
                "starterRate",
                "growthRate",
                "creatorRate",
                "growthMonthlyThreshold",
                "creatorMonthlyThreshold",
                "retailerPackageRate",
                "businessTimezone",
              ].map((k) => (
                <label key={k} className="flex flex-col gap-1">
                  <span className="text-muted-foreground">{k}</span>
                  <Input
                    value={edit[k] ?? (settings as any)[k]}
                    onChange={(e) => setEdit({ ...edit, [k]: e.target.value })}
                  />
                </label>
              ))}
            </div>
          )}
          <Button
            onClick={() => {
              const patch: any = {};
              for (const k of Object.keys(edit)) {
                const v = edit[k];
                patch[k] = k === "businessTimezone" ? v : Number(v);
              }
              update.mutate(patch);
              setEdit({});
            }}
            disabled={Object.keys(edit).length === 0 || update.isPending}
            className="w-full sm:w-auto"
          >
            Save settings
          </Button>
        </CardContent>
      </Card>

      {/* --- Payouts Card --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Payout Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Generate Batch Form — stacks on mobile, row on desktop */}
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Generate a payout batch for an affiliate. Commissions in that period must be{" "}
              <code className="px-1 rounded bg-muted">approved</code>.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex flex-col gap-1 text-sm">
                <span>Affiliate Link ID</span>
                <Input
                  value={payoutAffiliateId}
                  onChange={(e) => setPayoutAffiliateId(e.target.value)}
                  placeholder="e.g. 1"
                  inputMode="numeric"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span>Period Start</span>
                <Input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="w-full"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span>Period End</span>
                <Input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="w-full"
                />
              </label>
            </div>

            <Button
              className="gap-2 w-full sm:w-auto"
              disabled={!payoutAffiliateId || !periodStart || !periodEnd || generateBatch.isPending}
              onClick={() =>
                generateBatch.mutate({
                  affiliateLinkId: Number(payoutAffiliateId),
                  periodStart,
                  periodEnd,
                })
              }
            >
              <DollarSign className="w-4 h-4" />
              Generate Batch
            </Button>
          </div>

          {/* Batches List */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-4 text-sm sm:text-base">Generated Batches</h3>
            {batchesLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : !batches || batches.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payout batches generated yet.</p>
            ) : (
              <div className="overflow-x-auto -mx-4 px-4">
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-2 pr-3 whitespace-nowrap">ID</th>
                      <th className="py-2 pr-3">Affiliate</th>
                      <th className="py-2 pr-3 whitespace-nowrap">Period</th>
                      <th className="py-2 pr-3 whitespace-nowrap">Amount</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2 pr-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.map((b: any) => (
                      <tr key={b.id} className="border-b align-top">
                        <td className="py-2 pr-3 whitespace-nowrap">{b.id}</td>
                        <td className="py-2 pr-3">{b.affiliateName}</td>
                        <td className="py-2 pr-3 whitespace-nowrap">
                          {b.periodStart} → {b.periodEnd}
                        </td>
                        <td className="py-2 pr-3 font-medium whitespace-nowrap">
                          R{(b.totalAmountCents / 100).toFixed(2)}
                        </td>
                        <td className="py-2 pr-3 capitalize">{b.status}</td>
                        <td className="py-2 pr-3">
                          {b.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() => markPaid.mutate({ batchId: b.id })}
                              disabled={markPaid.isPending}
                            >
                              Mark Paid
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}