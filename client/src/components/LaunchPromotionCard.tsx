import { useEffect, useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function LaunchPromotionCard() {
  const utils = trpc.useUtils();
  const { data, isLoading, error } = trpc.admin.promotions.get.useQuery();
  const update = trpc.admin.promotions.update.useMutation({
    onSuccess: () => {
      utils.admin.promotions.get.invalidate();
      toast.success("Promotion updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const [limit, setLimit] = useState("");
  const [credits, setCredits] = useState("");

  useEffect(() => {
    if (data) {
      setLimit(String(data.recipientLimit));
      setCredits(String(data.creditsPerUser));
    }
  }, [data]);

  if (isLoading) return null;
  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Launch Promotion</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">{error?.message ?? "Unavailable"}</p>
        </CardContent>
      </Card>
    );
  }

  const toggle = () => {
    if (!data.enabled && !data.activatedAt) {
      const ok = window.confirm(
        "First activation records the launch time permanently. Only accounts created from now on can qualify. Continue?"
      );
      if (!ok) return;
    }
    update.mutate({ enabled: !data.enabled });
  };

  const save = () => {
    const recipientLimit = Number(limit);
    const creditsPerUser = Number(credits);
    if (!Number.isInteger(recipientLimit) || recipientLimit < 0) {
      toast.error("Recipient limit must be a whole number, 0 or more");
      return;
    }
    if (!Number.isInteger(creditsPerUser) || creditsPerUser < 1) {
      toast.error("Credits per user must be a whole number, 1 or more");
      return;
    }
    update.mutate({ recipientLimit, creditsPerUser });
  };

  const dirty =
    limit !== String(data.recipientLimit) || credits !== String(data.creditsPerUser);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Launch Promotion (first {data.recipientLimit} signups)</span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${
              data.enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
            }`}
          >
            {data.enabled ? "Enabled" : "Disabled"}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold">{data.awarded}</div>
            <p className="text-xs text-muted-foreground">Awarded</p>
          </div>
          <div>
            <div className="text-3xl font-bold">{data.recipientLimit}</div>
            <p className="text-xs text-muted-foreground">Limit</p>
          </div>
          <div>
            <div className="text-3xl font-bold">{data.remaining}</div>
            <p className="text-xs text-muted-foreground">Remaining</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-sm space-y-1">
            <span className="text-muted-foreground">Total recipient limit</span>
            <input
              type="number"
              min={0}
              step={1}
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className="w-full border rounded-md px-3 py-2 bg-background"
            />
          </label>
          <label className="text-sm space-y-1">
            <span className="text-muted-foreground">Credits per user</span>
            <input
              type="number"
              min={1}
              step={1}
              value={credits}
              onChange={(e) => setCredits(e.target.value)}
              className="w-full border rounded-md px-3 py-2 bg-background"
            />
          </label>
        </div>

        <div className="flex gap-2">
          <Button onClick={save} disabled={!dirty || update.isPending}>
            Save settings
          </Button>
          <Button variant="outline" onClick={toggle} disabled={update.isPending}>
            {data.enabled ? "Disable" : "Enable"}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          {data.activatedAt
            ? `Launch activated ${new Date(data.activatedAt).toLocaleString()}. `
            : "Not yet activated. "}
          Disabling or changing settings never revokes credits or resets the award count.
        </p>
      </CardContent>
    </Card>
  );
}
