import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Copy, Check } from "lucide-react";

export default function AffiliateDashboard() {
  const { data: me, isLoading: meLoading, refetch: refetchMe } =
    trpc.affiliate.getMyAffiliate.useQuery();
  const { data: commissions, isLoading: cLoading } =
    trpc.affiliate.getMyCommissions.useQuery({ limit: 50 });

  const applyMutation = trpc.affiliate.applyForAffiliate.useMutation({
    onSuccess: () => refetchMe(),
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [copied, setCopied] = useState(false);

  if (meLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  // No affiliate record yet — show application form
  if (!me) {
    return (
      <div className="max-w-xl mx-auto p-4 sm:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Become a ThatOne Affiliate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Earn 10–15% on every qualifying credit purchase by customers you
              refer, during their first 90 days. Business packages earn a flat
              5%. Applications are reviewed by our team.
            </p>
            <Input
              placeholder="Your affiliate display name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              placeholder="Short description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Button
              disabled={name.trim().length < 2 || applyMutation.isPending}
              onClick={() =>
                applyMutation.mutate({
                  affiliateName: name.trim(),
                  description: description.trim() || undefined,
                })
              }
              className="w-full"
            >
              {applyMutation.isPending ? "Submitting…" : "Apply"}
            </Button>
            {applyMutation.error && (
              <p className="text-sm text-red-500">
                {applyMutation.error.message}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pending application
  if (me.status === "pending") {
    return (
      <div className="max-w-xl mx-auto p-4 sm:p-6">
        <Card>
          <CardHeader><CardTitle className="text-base sm:text-lg">Application pending</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Your application was submitted on{" "}
              {new Date(me.appliedAt).toLocaleDateString()}. We'll notify you
              when it's reviewed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Rejected
  if (me.status === "rejected") {
    return (
      <div className="max-w-xl mx-auto p-4 sm:p-6">
        <Card>
          <CardHeader><CardTitle className="text-base sm:text-lg">Application not approved</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {me.rejectedReason || "No reason provided."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Approved
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Affiliate Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back, {me.affiliateName}
        </p>
      </div>

      {me.shareUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Your referral link</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Stacks the code and copy button on mobile, side-by-side on desktop */}
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center bg-muted p-3 rounded border">
              <code className="text-xs flex-1 break-all sm:truncate">
                {me.shareUrl}
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  navigator.clipboard.writeText(me.shareUrl!);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="self-stretch sm:self-auto shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    <span className="sm:hidden">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    <span className="sm:hidden">Copy</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary cards — 2 per row on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(["pending", "approved", "paid", "reversed"] as const).map((s) => (
          <Card key={s}>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground uppercase">{s}</p>
              <p className="text-xl sm:text-2xl font-bold break-words">
                R{((commissions?.totals[s] ?? 0) / 100).toFixed(2)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Commission history</CardTitle>
        </CardHeader>
        <CardContent>
          {cLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : !commissions?.items.length ? (
            <p className="text-sm text-muted-foreground">No commissions yet.</p>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-3 whitespace-nowrap">Date</th>
                    <th className="py-2 pr-3">Package</th>
                    <th className="py-2 pr-3 whitespace-nowrap">Amount</th>
                    <th className="py-2 pr-3 whitespace-nowrap">Rate</th>
                    <th className="py-2 pr-3 whitespace-nowrap">Commission</th>
                    <th className="py-2 pr-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.items.map((c) => (
                    <tr key={c.id} className="border-b align-top">
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2 pr-3">{c.packageId}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        R{(c.qualifyingAmountCents / 100).toFixed(2)}
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {c.appliedRate}%{c.tier ? ` (${c.tier})` : ""}
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        R{(c.commissionAmountCents / 100).toFixed(2)}
                      </td>
                      <td className="py-2 pr-3 capitalize">{c.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}