import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Zap, History, Upload } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth({ redirectOnUnauthenticated: true });
  const [, setLocation] = useLocation();
  const [selectedUserImage, setSelectedUserImage] = useState<string | null>(null);
  const [selectedGarmentImage, setSelectedGarmentImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch user credits
  const { data: credits, isLoading: creditsLoading, refetch: refetchCredits } = 
    trpc.tryon.getCredits.useQuery();

  // Fetch transaction history
  const { data: transactions, isLoading: transactionsLoading } = 
    trpc.tryon.getTransactionHistory.useQuery({ limit: 20 });

  // Create try-on mutation
  const createTryOnMutation = trpc.tryon.createTryOn.useMutation({
    onSuccess: async (result) => {
      setIsProcessing(false);
      await refetchCredits();
      // Show result image
      alert(`Try-on successful! Remaining credits: ${result.remainingCredits}`);
      // Here you could display the result image
      console.log("Result image:", result.resultImage);
    },
    onError: (error) => {
      setIsProcessing(false);
      alert(`Error: ${error.message}`);
    },
  });

  const handleImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "user" | "garment"
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (type === "user") {
        setSelectedUserImage(base64);
      } else {
        setSelectedGarmentImage(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateTryOn = async () => {
    if (!selectedUserImage || !selectedGarmentImage) {
      alert("Please upload both user and garment images");
      return;
    }

    setIsProcessing(true);
    await createTryOnMutation.mutateAsync({
      userImage: selectedUserImage,
      garmentImage: selectedGarmentImage,
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">StyleSwap Dashboard</h1>
          <p className="text-muted-foreground">Welcome, {user?.name}!</p>
        </div>

        {/* Credits Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Total Credits
              </CardTitle>
            </CardHeader>
            <CardContent>
              {creditsLoading ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <div className="text-4xl font-bold text-primary">
                  {credits?.totalCredits || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-secondary" />
                Remaining Credits
              </CardTitle>
            </CardHeader>
            <CardContent>
              {creditsLoading ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <div className="text-4xl font-bold text-secondary">
                  {credits?.remainingCredits || 0}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="premium-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-foreground/50" />
                Used Credits
              </CardTitle>
            </CardHeader>
            <CardContent>
              {creditsLoading ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <div className="text-4xl font-bold text-foreground/50">
                  {credits?.usedCredits || 0}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Virtual Try-On Section */}
        <Card className="premium-card mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Create Virtual Try-On
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* User Image Upload */}
              <div className="space-y-3">
                <label className="block text-sm font-medium">Your Photo</label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  {selectedUserImage ? (
                    <div className="space-y-3">
                      <img
                        src={selectedUserImage}
                        alt="User"
                        className="w-full h-48 object-cover rounded"
                      />
                      <Button
                        variant="outline"
                        onClick={() => setSelectedUserImage(null)}
                      >
                        Change Image
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload your photo
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, "user")}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Garment Image Upload */}
              <div className="space-y-3">
                <label className="block text-sm font-medium">Garment Photo</label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  {selectedGarmentImage ? (
                    <div className="space-y-3">
                      <img
                        src={selectedGarmentImage}
                        alt="Garment"
                        className="w-full h-48 object-cover rounded"
                      />
                      <Button
                        variant="outline"
                        onClick={() => setSelectedGarmentImage(null)}
                      >
                        Change Image
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload garment photo
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, "garment")}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <Button
              onClick={handleCreateTryOn}
              disabled={!selectedUserImage || !selectedGarmentImage || isProcessing}
              className="w-full premium-button bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Creating Try-On...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" />
                  Create Virtual Try-On (1 Credit)
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : transactions && transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex justify-between items-center p-4 bg-secondary/5 rounded-lg border border-border/20"
                  >
                    <div>
                      <p className="font-medium capitalize">{tx.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {tx.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        {tx.type === "purchase" ? "+" : "-"}{tx.amount}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No transactions yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Buy Credits Button */}
        <div className="mt-8 text-center">
          <Button
            onClick={() => setLocation("/pricing")}
            className="premium-button bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 text-lg"
          >
            Buy More Credits
          </Button>
        </div>
      </div>
    </div>
  );
}
