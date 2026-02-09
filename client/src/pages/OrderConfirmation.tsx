import { useEffect, useState } from "react";
import { useSearchParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function OrderConfirmation() {
  const [searchParams] = useSearchParams();
  const [, setLocation] = useLocation();
  const [orderStatus, setOrderStatus] = useState<"loading" | "success" | "error">("loading");
  const [orderData, setOrderData] = useState<any>(null);

  const orderNumber = searchParams.get("orderNumber");
  const paymentStatus = searchParams.get("status");

  useEffect(() => {
    if (paymentStatus === "success" && orderNumber) {
      setOrderStatus("success");
      setOrderData({
        orderNumber,
        amount: searchParams.get("amount"),
        date: new Date().toLocaleDateString(),
      });
    } else if (paymentStatus === "cancel") {
      setOrderStatus("error");
    } else {
      setOrderStatus("loading");
    }
  }, [paymentStatus, orderNumber, searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {orderStatus === "loading" && (
            <>
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
              <CardTitle>Processing Your Order...</CardTitle>
            </>
          )}
          {orderStatus === "success" && (
            <>
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <CardTitle>Order Confirmed!</CardTitle>
            </>
          )}
          {orderStatus === "error" && (
            <>
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <CardTitle>Order Cancelled</CardTitle>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {orderStatus === "success" && orderData && (
            <>
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Number</span>
                  <span className="font-semibold">{orderData.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-semibold">{orderData.date}</span>
                </div>
                {orderData.amount && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-semibold">R{orderData.amount}</span>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-semibold mb-2">What's Next?</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>You will receive an order confirmation email shortly</li>
                  <li>Your order will be processed and shipped within 2-3 business days</li>
                  <li>You will receive a tracking number via SMS and email</li>
                </ul>
              </div>

              <div className="space-y-2">
                <Button onClick={() => setLocation("/my-orders")} className="w-full">
                  View My Orders
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setLocation("/")}
                  className="w-full"
                >
                  Continue Shopping
                </Button>
              </div>
            </>
          )}

          {orderStatus === "error" && (
            <>
              <p className="text-center text-muted-foreground">
                Your payment was cancelled. No charges have been made to your account.
              </p>
              <Button onClick={() => setLocation("/")} className="w-full">
                Return to Home
              </Button>
            </>
          )}

          {orderStatus === "loading" && (
            <p className="text-center text-muted-foreground">
              Please wait while we confirm your order...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
