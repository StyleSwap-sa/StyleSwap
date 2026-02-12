import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Search, Plus, Minus, Eye, Upload, Calendar, AlertCircle } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function AdminCredits() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [creditsToAdd, setCreditsToAdd] = useState("");
  const [creditsToDeduct, setCreditsToDeduct] = useState("");
  const [reason, setReason] = useState("");
  const [action, setAction] = useState<"add" | "deduct" | "bulk" | "expiry" | null>(null);
  const [csvContent, setCsvContent] = useState("");
  const [bulkResults, setBulkResults] = useState<any>(null);
  const [expiryDate, setExpiryDate] = useState("");
  const [expiryReason, setExpiryReason] = useState("");
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"manage" | "bulk" | "expiring">("manage");

  // Check if user is admin
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
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

  // Bulk add credits mutation
  const bulkAddCreditsMutation = trpc.adminCredits.bulkAddCredits.useMutation({
    onSuccess: (result) => {
      setBulkResults(result);
      setCsvContent("");
    },
  });

  // Get expiring credits
  const expiringCredits = trpc.adminCredits.getExpiringCredits.useQuery({
    daysUntilExpiry: 7,
  });

  // Extend credit expiry mutation
  const extendExpiryMutation = trpc.adminCredits.extendCreditExpiry.useMutation({
    onSuccess: () => {
      setExpiryDate("");
      setExpiryReason("");
      setAction(null);
      expiringCredits.refetch();
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

  const handleBulkUpload = async () => {
    if (!csvContent.trim()) return;
    await bulkAddCreditsMutation.mutateAsync({
      csvData: csvContent,
    });
  };

  const handleExtendExpiry = async (customerId: number) => {
    if (!expiryDate || !expiryReason) return;
    await extendExpiryMutation.mutateAsync({
      userId: customerId,
      newExpiryDate: new Date(expiryDate),
      reason: expiryReason,
    });
  };

  const handleCSVFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setCsvContent(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="min-h-screen bg-background p-2 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold mb-2">Credit Management</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage customer credits and create custom packages
          </p>
        </div>

        {/* Statistics */}
        {statistics.data && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4 mb-6 md:mb-8">
            <Card className="col-span-1">
              <CardHeader className="pb-2 p-3 md:p-6">
                <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                  Customers
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
                <p className="text-lg md:text-2xl font-bold">
                  {statistics.data.totalCustomers || 0}
                </p>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader className="pb-2 p-3 md:p-6">
                <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                  Distributed
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
                <p className="text-lg md:text-2xl font-bold">
                  {statistics.data.totalCreditsDistributed || 0}
                </p>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader className="pb-2 p-3 md:p-6">
                <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                  Used
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
                <p className="text-lg md:text-2xl font-bold">
                  {statistics.data.totalCreditsUsed || 0}
                </p>
              </CardContent>
            </Card>

            <Card className="col-span-1">
              <CardHeader className="pb-2 p-3 md:p-6">
                <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                  Remaining
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
                <p className="text-lg md:text-2xl font-bold text-green-600">
                  {statistics.data.totalCreditsRemaining || 0}
                </p>
              </CardContent>
            </Card>

            <Card className="col-span-2 md:col-span-1">
              <CardHeader className="pb-2 p-3 md:p-6">
                <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                  Avg/Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
                <p className="text-lg md:text-2xl font-bold">
                  {Math.round(statistics.data.averageCreditsPerCustomer || 0)}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <Button
            variant={activeTab === "manage" ? "default" : "outline"}
            onClick={() => setActiveTab("manage")}
            className="whitespace-nowrap text-xs md:text-sm"
          >
            <Eye className="w-4 h-4 mr-2" />
            Manage
          </Button>
          <Button
            variant={activeTab === "bulk" ? "default" : "outline"}
            onClick={() => setActiveTab("bulk")}
            className="whitespace-nowrap text-xs md:text-sm"
          >
            <Upload className="w-4 h-4 mr-2" />
            Bulk
          </Button>
          <Button
            variant={activeTab === "expiring" ? "default" : "outline"}
            onClick={() => setActiveTab("expiring")}
            className="whitespace-nowrap text-xs md:text-sm"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Expiring
          </Button>
        </div>

        {/* Manage Tab */}
        {activeTab === "manage" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
            {/* Search Section */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <Search className="w-4 h-4 md:w-5 md:h-5" />
                    Find Customer
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6 space-y-4">
                  <Input
                    placeholder="Search by email or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="text-sm"
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
                          className={`w-full text-left p-2 md:p-3 rounded-lg border transition-colors text-sm ${
                            selectedCustomer?.id === customer.id
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border hover:bg-accent"
                          }`}
                        >
                          <div className="font-semibold">{customer.name}</div>
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
                    <CardHeader className="p-4 md:p-6">
                      <CardTitle className="text-base md:text-lg">Customer Details</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6 space-y-3 text-sm">
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground">Name</p>
                        <p className="font-semibold">{getCustomerDetails.data.user.name}</p>
                      </div>
                      <div>
                        <p className="text-xs md:text-sm text-muted-foreground">Email</p>
                        <p className="font-semibold text-xs md:text-sm break-all">
                          {getCustomerDetails.data.user.email}
                        </p>
                      </div>
                      <div className="pt-4 border-t">
                        <p className="text-xs md:text-sm text-muted-foreground mb-2">
                          Credit Summary
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-accent p-2 rounded text-xs">
                            <p className="text-xs text-muted-foreground">Total</p>
                            <p className="font-bold">
                              {getCustomerDetails.data.credits.totalCredits}
                            </p>
                          </div>
                          <div className="bg-accent p-2 rounded text-xs">
                            <p className="text-xs text-muted-foreground">Used</p>
                            <p className="font-bold">
                              {getCustomerDetails.data.credits.usedCredits}
                            </p>
                          </div>
                          <div className="bg-green-100 dark:bg-green-900 p-2 rounded text-xs">
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
                    <CardHeader className="p-4 md:p-6">
                      <CardTitle className="text-base md:text-lg">Adjust Credits</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6 space-y-4">
                      {action === null ? (
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            onClick={() => setAction("add")}
                            className="flex items-center gap-2 text-xs md:text-sm"
                          >
                            <Plus className="w-4 h-4" />
                            Add
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setAction("deduct")}
                            className="flex items-center gap-2 text-xs md:text-sm"
                          >
                            <Minus className="w-4 h-4" />
                            Deduct
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs md:text-sm font-medium">
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
                              className="text-sm"
                            />
                          </div>

                          <div>
                            <label className="text-xs md:text-sm font-medium">Reason</label>
                            <Input
                              value={reason}
                              onChange={(e) => setReason(e.target.value)}
                              placeholder="e.g., Custom package"
                              className="text-sm"
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
                              className="text-xs md:text-sm"
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
                              className="text-xs md:text-sm"
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
                    <CardHeader className="p-4 md:p-6">
                      <CardTitle className="text-base md:text-lg">Transaction History</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6">
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {getCustomerDetails.data.transactions.length === 0 ? (
                          <p className="text-xs md:text-sm text-muted-foreground text-center py-4">
                            No transactions yet
                          </p>
                        ) : (
                          getCustomerDetails.data.transactions.map((tx: any) => (
                            <div
                              key={tx.id}
                              className="flex justify-between items-start p-2 border-b last:border-b-0 text-xs md:text-sm"
                            >
                              <div>
                                <p className="font-semibold capitalize">{tx.type}</p>
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
                  <CardContent className="pt-6 p-4 md:p-6">
                    <p className="text-center text-xs md:text-sm text-muted-foreground">
                      Search and select a customer to manage their credits
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Bulk Tab */}
        {activeTab === "bulk" && (
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Upload className="w-4 h-4 md:w-5 md:h-5" />
                Bulk Add Credits
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900 p-3 md:p-4 rounded-lg text-xs md:text-sm">
                <p className="font-semibold mb-2">CSV Format:</p>
                <p className="font-mono text-xs">email,credits,reason</p>
                <p className="font-mono text-xs mt-1">john@example.com,500,Retail partnership</p>
              </div>

              <div>
                <label className="text-xs md:text-sm font-medium block mb-2">
                  Upload CSV or Paste Content
                </label>
                <input
                  ref={csvInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCSVFileSelect}
                  className="hidden"
                />
                <Button
                  onClick={() => csvInputRef.current?.click()}
                  variant="outline"
                  className="w-full text-xs md:text-sm mb-2"
                >
                  Choose CSV File
                </Button>
              </div>

              <div>
                <label className="text-xs md:text-sm font-medium block mb-2">
                  Or Paste CSV Content
                </label>
                <textarea
                  value={csvContent}
                  onChange={(e) => setCsvContent(e.target.value)}
                  placeholder="email,credits,reason&#10;john@example.com,500,Retail partnership"
                  className="w-full h-32 md:h-48 p-2 md:p-3 border rounded-lg text-xs md:text-sm font-mono"
                />
              </div>

              <Button
                onClick={handleBulkUpload}
                disabled={!csvContent.trim() || bulkAddCreditsMutation.isPending}
                className="w-full text-xs md:text-sm"
              >
                {bulkAddCreditsMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  "Process Bulk Upload"
                )}
              </Button>

              {bulkResults && (
                <Card className="bg-accent">
                  <CardContent className="p-3 md:p-4 text-xs md:text-sm">
                    <p className="font-semibold mb-2">Results:</p>
                    <p className="text-green-600">✓ Success: {bulkResults.success}</p>
                    <p className="text-red-600">✗ Failed: {bulkResults.failed}</p>
                    {bulkResults.errors.length > 0 && (
                      <div className="mt-2 max-h-40 overflow-y-auto">
                        <p className="font-semibold mb-1">Errors:</p>
                        {bulkResults.errors.map((error: string, idx: number) => (
                          <p key={idx} className="text-red-600 text-xs">
                            {error}
                          </p>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        )}

        {/* Expiring Tab */}
        {activeTab === "expiring" && (
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <AlertCircle className="w-4 h-4 md:w-5 md:h-5" />
                Credits Expiring Soon
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              {expiringCredits.isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : expiringCredits.data && expiringCredits.data.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {expiringCredits.data.map((credit: any) => (
                    <Card key={credit.userId} className="bg-yellow-50 dark:bg-yellow-900">
                      <CardContent className="p-3 md:p-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
                          <div className="text-xs md:text-sm">
                            <p className="font-semibold">{credit.user.name}</p>
                            <p className="text-muted-foreground">{credit.user.email}</p>
                            <p className="mt-1">
                              Remaining: <span className="font-bold">{credit.remainingCredits}</span>
                            </p>
                            <p className="text-xs">
                              Expires: {new Date(credit.expiresAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            onClick={() => {
                              setSelectedCustomer(credit.user);
                              setAction("expiry");
                            }}
                            className="text-xs md:text-sm w-full md:w-auto"
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            Extend
                          </Button>
                        </div>

                        {action === "expiry" && selectedCustomer?.id === credit.userId && (
                          <div className="space-y-2 mt-3 pt-3 border-t">
                            <div>
                              <label className="text-xs font-medium">New Expiry Date</label>
                              <Input
                                type="date"
                                value={expiryDate}
                                onChange={(e) => setExpiryDate(e.target.value)}
                                className="text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium">Reason</label>
                              <Input
                                value={expiryReason}
                                onChange={(e) => setExpiryReason(e.target.value)}
                                placeholder="e.g., Customer retention"
                                className="text-xs"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                onClick={() => handleExtendExpiry(credit.userId)}
                                disabled={!expiryDate || !expiryReason || extendExpiryMutation.isPending}
                                className="text-xs"
                              >
                                {extendExpiryMutation.isPending ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  "Extend"
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setAction(null);
                                  setExpiryDate("");
                                  setExpiryReason("");
                                }}
                                className="text-xs"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-xs md:text-sm text-muted-foreground py-8">
                  No credits expiring in the next 7 days
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
