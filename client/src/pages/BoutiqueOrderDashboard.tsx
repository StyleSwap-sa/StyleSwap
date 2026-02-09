import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Package, Loader2, ChevronRight, MapPin, Phone, Calendar, DollarSign, CheckCircle, Clock, Truck, AlertCircle } from "lucide-react";

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

const STATUS_ICONS: Record<string, any> = {
  pending: Clock,
  confirmed: CheckCircle,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: AlertCircle,
};

export default function BoutiqueOrderDashboard() {
  const { isAuthenticated, loading, user } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [isAuthenticated, loading]);

  // Fetch boutique orders
  const { data: boutique } = trpc.boutiques.getMyBoutique.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const { data: orders = [], isLoading: ordersLoading, refetch } = trpc.orders.getBoutiqueOrders.useQuery(
    { boutiqueId: boutique?.id || 0 },
    { enabled: !!boutique?.id }
  );

  const updateStatusMutation = trpc.orders.updateStatus.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const filteredOrders = filterStatus
    ? orders.filter((o: Order) => o.status === filterStatus)
    : orders;

  const stats = {
    total: orders.length,
    pending: orders.filter((o: Order) => o.status === "pending").length,
    processing: orders.filter((o: Order) => o.status === "processing").length,
    delivered: orders.filter((o: Order) => o.status === "delivered").length,
  };

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        orderId,
        status: newStatus as any,
      });
    } catch (error) {
      console.error("Failed to update order status:", error);
    }
  };

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
          <h1 className="text-3xl font-bold mb-2">Order Management</h1>
          <p className="text-muted-foreground">
            Manage and track customer orders for {boutique?.name}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <Package className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Processing</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.processing}</p>
                </div>
                <Truck className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Delivered</p>
                  <p className="text-3xl font-bold text-green-600">{stats.delivered}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <Button
            variant={filterStatus === null ? "default" : "outline"}
            onClick={() => setFilterStatus(null)}
          >
            All Orders
          </Button>
          {Object.entries(STATUS_LABELS).map(([status, label]) => (
            <Button
              key={status}
              variant={filterStatus === status ? "default" : "outline"}
              onClick={() => setFilterStatus(status)}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No orders found</h3>
              <p className="text-muted-foreground">
                {filterStatus
                  ? `No orders with status "${STATUS_LABELS[filterStatus]}"`
                  : "You don't have any orders yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order: Order) => {
              const StatusIcon = STATUS_ICONS[order.status];
              return (
                <Card
                  key={order.id}
                  className="hover:shadow-lg transition cursor-pointer"
                  onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                >
                  <CardContent className="p-6">
                    {/* Order Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <StatusIcon className="w-6 h-6 text-muted-foreground" />
                        <div>
                          <h3 className="font-semibold text-lg">{order.productName}</h3>
                          <p className="text-sm text-muted-foreground">
                            Order #{order.orderNumber}
                          </p>
                        </div>
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

                        {/* Status Update Buttons */}
                        <div>
                          <h4 className="font-semibold mb-2">Update Status</h4>
                          <div className="flex gap-2 flex-wrap">
                            {Object.entries(STATUS_LABELS).map(([status, label]) => (
                              <Button
                                key={status}
                                variant={order.status === status ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleStatusUpdate(order.id, status)}
                                disabled={updateStatusMutation.isPending}
                              >
                                {label}
                              </Button>
                            ))}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-4">
                          <Button variant="outline" className="flex-1">
                            Print Packing Slip
                          </Button>
                          <Button variant="outline" className="flex-1">
                            Send Notification
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
