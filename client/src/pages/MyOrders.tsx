import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Package, Loader2, ChevronRight, MapPin, Phone, Calendar, DollarSign } from "lucide-react";

interface Order {
  id: number;
  orderNumber: string;
  boutiqueId: number;
  productName: string;
  quantity: number;
  amount: number;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  deliveryAddress: string;
  customerPhone: string;
  createdAt: Date;
  updatedAt: Date;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function MyOrders() {
  const { isAuthenticated, loading } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [isAuthenticated, loading]);

  // Fetch customer orders
  const { data: orders = [], isLoading: ordersLoading } = trpc.orders.getMyOrders.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  if (loading || ordersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Orders</h1>
          <p className="text-muted-foreground">
            Track and manage your purchases
          </p>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
              <p className="text-muted-foreground mb-4">
                You haven't placed any orders yet. Start shopping to see your orders here.
              </p>
              <Button onClick={() => window.location.href = "/"}>
                Continue Shopping
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order: Order) => (
              <Card
                key={order.id}
                className="hover:shadow-lg transition cursor-pointer"
                onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
              >
                <CardContent className="p-6">
                  {/* Order Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{order.productName}</h3>
                      <p className="text-sm text-muted-foreground">
                        Order #{order.orderNumber}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        R{order.amount.toFixed(2)}
                      </div>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 ${
                          STATUS_COLORS[order.status]
                        }`}
                      >
                        {STATUS_LABELS[order.status]}
                      </span>
                    </div>
                  </div>

                  {/* Order Details Grid */}
                  <div className="grid md:grid-cols-4 gap-4 mb-4 pb-4 border-b">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Order Date</p>
                        <p className="font-semibold text-sm">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Quantity</p>
                        <p className="font-semibold text-sm">{order.quantity}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Total</p>
                        <p className="font-semibold text-sm">
                          R{order.amount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Contact</p>
                        <p className="font-semibold text-sm">{order.customerPhone}</p>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Details */}
                  {selectedOrder?.id === order.id && (
                    <div className="space-y-4 pt-4 border-t">
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Delivery Address
                        </h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {order.deliveryAddress}
                        </p>
                      </div>

                      {/* Status Timeline */}
                      <div>
                        <h4 className="font-semibold mb-2">Order Status</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <span className="text-sm">Order Placed</span>
                            <span className="text-xs text-muted-foreground ml-auto">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {order.status !== "pending" && (
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-blue-500" />
                              <span className="text-sm">Confirmed</span>
                            </div>
                          )}
                          {["processing", "shipped", "delivered"].includes(order.status) && (
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-purple-500" />
                              <span className="text-sm">Processing</span>
                            </div>
                          )}
                          {["shipped", "delivered"].includes(order.status) && (
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-indigo-500" />
                              <span className="text-sm">Shipped</span>
                            </div>
                          )}
                          {order.status === "delivered" && (
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-green-500" />
                              <span className="text-sm">Delivered</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-4">
                        <Button variant="outline" className="flex-1">
                          Contact Support
                        </Button>
                        <Button variant="outline" className="flex-1">
                          Print Receipt
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Expand Indicator */}
                  <div className="flex justify-end">
                    <ChevronRight
                      className={`w-5 h-5 text-muted-foreground transition ${
                        selectedOrder?.id === order.id ? "rotate-90" : ""
                      }`}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
