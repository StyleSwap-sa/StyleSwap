import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface OrderCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id?: number;
    name: string;
    price: number;
    size?: string;
    color?: string;
  };
  boutiqueId: number;
  quantity?: number;
}

export function OrderCheckoutModal({
  isOpen,
  onClose,
  product,
  boutiqueId,
  quantity = 1,
}: OrderCheckoutModalProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    deliveryAddress: "",
    customerPhone: "",
    notes: "",
  });

  const createCheckoutMutation = trpc.orders.createCheckout.useMutation();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckout = async () => {
    // Validate required fields
    if (!formData.deliveryAddress.trim()) {
      toast({
        title: "Error",
        description: "Please enter a delivery address",
        variant: "destructive",
      });
      return;
    }

    if (!formData.customerPhone.trim()) {
      toast({
        title: "Error",
        description: "Please enter a phone number",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await createCheckoutMutation.mutateAsync({
        boutiqueId,
        productId: product.id,
        productName: product.name,
        quantity,
        size: product.size,
        color: product.color,
        amount: product.price * quantity,
        deliveryAddress: formData.deliveryAddress,
        customerPhone: formData.customerPhone,
        notes: formData.notes,
        successUrl: `${window.location.origin}/order-confirmation`,
        cancelUrl: `${window.location.origin}/boutique/${boutiqueId}/shop`,
      });

      if (result.checkoutUrl) {
        // Redirect to Yoko checkout
        window.open(result.checkoutUrl, "_blank");
        toast({
          title: "Success",
          description: "Redirecting to payment...",
        });
        onClose();
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Error",
        description: "Failed to create checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Complete Your Order</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order Summary */}
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Order Summary</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>{product.name}</span>
                <span>R{product.price.toFixed(2)}</span>
              </div>
              {product.size && (
                <div className="text-muted-foreground">Size: {product.size}</div>
              )}
              {product.color && (
                <div className="text-muted-foreground">Color: {product.color}</div>
              )}
              <div className="flex justify-between">
                <span>Quantity</span>
                <span>{quantity}</span>
              </div>
              <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span>R{(product.price * quantity).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="space-y-2">
            <Label htmlFor="deliveryAddress">Delivery Address *</Label>
            <Textarea
              id="deliveryAddress"
              name="deliveryAddress"
              placeholder="Enter your full delivery address"
              value={formData.deliveryAddress}
              onChange={handleInputChange}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="customerPhone">Phone Number *</Label>
            <Input
              id="customerPhone"
              name="customerPhone"
              type="tel"
              placeholder="+27 123 456 7890"
              value={formData.customerPhone}
              onChange={handleInputChange}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Special Instructions (Optional)</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="Any special delivery instructions..."
              value={formData.notes}
              onChange={handleInputChange}
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCheckout}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Pay R${(product.price * quantity).toFixed(2)}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
