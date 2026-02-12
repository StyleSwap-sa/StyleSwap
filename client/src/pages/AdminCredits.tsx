import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Search, Plus, Minus, Eye } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function AdminCredits() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [creditsToAdd, setCreditsToAdd] = useState("");
  const [creditsToDeduct, setCreditsToDeduct] = useState("");
  const [reason, setReason] = useState("");
  const [action, setAction] = useState<"add" | "deduct" | null>(null);

  // Check if user is admin
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-red-600 font-semibold">
              Access Denied: Admin only
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Search customers
  const searchCustomers = trpc.adminCredits.searchCustomers.useQuery(
    { query: searchQuery, limit: 20 },
    { enabled: searchQuery.length > 2 }
  );

  // Get customer details
  const getCustomerDetails = trpc.adminCredits.getCustomerDetails.useQuery(
    { userId: selectedCustomer?.id || 0 },
    { enabled: !!selectedCustomer }
  );

  // Add credits mutation
  const addCreditsMutation = trpc.adminCredits.addCreditsToCustomer.useMutation({
    onSuccess: () => {
      setCreditsToAdd("");
      setReason("");
      setAction(null);
      getCustomerDetails.refetch();
    },
  });

  // Deduct credits mutation
  const deductCreditsMutation = trpc.adminCredits.deductCreditsFromCustomer.useMutation({
    onSuccess: () => {
      setCreditsToDeduct("");
      setReason("");
      setAction(null);
      getCustomerDetails.refetch();
    },
  });

  // Get statistics
  const statistics = trpc.adminCredits.getCreditsStatistics.useQuery();

  const handleAddCredits = async () => {
    if (!selectedCustomer || !creditsToAdd || !reason) return;
    await addCreditsMutation.mutateAsync({
      userId: selectedCustomer.id,
      creditsToAdd: parseInt(creditsToAdd),
      reason,
    });
  };

  const handleDeductCredits = async () => {
    if (!selectedCustomer || !creditsToDeduct || !reason) return;
    await deductCreditsMutation.mutateAsync({
      userId: selectedCustomer.id,
      creditsToDeduct: parseInt(creditsToDeduct),
      reason,
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Credit Management</h1>
          <p className="text-muted-foreground">
            Manage customer credits and create custom packages
          </p>
        </div>

        {/* Statistics */}
        {statistics.data && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Customers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {statistics.data.totalCustomers || 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Distributed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {statistics.data.totalCreditsDistributed || 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Used
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {statistics.data.totalCreditsUsed || 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Remaining
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600">
                  {statistics.data.totalCreditsRemaining || 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Avg per Customer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {Math.round(statistics.data.averageCreditsPerCustomer || 0)}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Search Section */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Find Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Search by email or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />

                {searchCustomers.isLoading && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                )}

                {searchCustomers.data && (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {searchCustomers.data.map((customer) => (
                      <button
                        key={customer.id}
                        onClick={() => setSelectedCustomer(customer)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedCustomer?.id === customer.id
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:bg-accent"
                        }`}
                      >
                        <div className="font-semibold text-sm">{customer.name}</div>
                        <div className="text-xs opacity-75">{customer.email}</div>
                        <div className="text-xs mt-1">
                          Credits: {customer.credits?.remainingCredits || 0}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Customer Details & Actions */}
          <div className="lg:col-span-2 space-y-4">
            {selectedCustomer && getCustomerDetails.data ? (
              <>
                {/* Customer Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Customer Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-semibold">{getCustomerDetails.data.user.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-semibold">{getCustomerDetails.data.user.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">User Type</p>
                      <p className="font-semibold capitalize">
                        {getCustomerDetails.data.user.userType}
                      </p>
                    </div>
                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-2">Credit Summary</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-accent p-2 rounded">
                          <p className="text-xs text-muted-foreground">Total</p>
                          <p className="font-bold">
                            {getCustomerDetails.data.credits.totalCredits}
                          </p>
                        </div>
                        <div className="bg-accent p-2 rounded">
                          <p className="text-xs text-muted-foreground">Used</p>
                          <p className="font-bold">
                            {getCustomerDetails.data.credits.usedCredits}
                          </p>
                        </div>
                        <div className="bg-green-100 dark:bg-green-900 p-2 rounded">
                          <p className="text-xs text-muted-foreground">Remaining</p>
                          <p className="font-bold text-green-600 dark:text-green-400">
                            {getCustomerDetails.data.credits.remainingCredits}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Add/Deduct Credits */}
                <Card>
                  <CardHeader>
                    <CardTitle>Adjust Credits</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {action === null ? (
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => setAction("add")}
                          className="flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add Credits
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setAction("deduct")}
                          className="flex items-center gap-2"
                        >
                          <Minus className="w-4 h-4" />
                          Deduct Credits
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium">
                            {action === "add" ? "Credits to Add" : "Credits to Deduct"}
                          </label>
                          <Input
                            type="number"
                            min="1"
                            value={action === "add" ? creditsToAdd : creditsToDeduct}
                            onChange={(e) =>
                              action === "add"
                                ? setCreditsToAdd(e.target.value)
                                : setCreditsToDeduct(e.target.value)
                            }
                            placeholder="Enter amount"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-medium">Reason</label>
                          <Input
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="e.g., Custom package for retail client"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            onClick={() =>
                              action === "add" ? handleAddCredits() : handleDeductCredits()
                            }
                            disabled={
                              !reason ||
                              (action === "add" ? !creditsToAdd : !creditsToDeduct) ||
                              addCreditsMutation.isPending ||
                              deductCreditsMutation.isPending
                            }
                          >
                            {addCreditsMutation.isPending || deductCreditsMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              `${action === "add" ? "Add" : "Deduct"} Credits`
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setAction(null);
                              setCreditsToAdd("");
                              setCreditsToDeduct("");
                              setReason("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Transaction History */}
                <Card>
                  <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {getCustomerDetails.data.transactions.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No transactions yet
                        </p>
                      ) : (
                        getCustomerDetails.data.transactions.map((tx: any) => (
                          <div
                            key={tx.id}
                            className="flex justify-between items-start p-2 border-b last:border-b-0"
                          >
                            <div>
                              <p className="font-semibold text-sm capitalize">{tx.type}</p>
                              <p className="text-xs text-muted-foreground">{tx.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(tx.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <p
                              className={`font-bold ${
                                tx.amount > 0 ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {tx.amount > 0 ? "+" : ""}{tx.amount}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    Search and select a customer to manage their credits
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
