import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { createOrder, getOrdersByCustomer, getOrdersByBoutique, getOrderById, updateOrderStatus } from "../db";
import { TRPCError } from "@trpc/server";

export const ordersRouter = router({
  // Create a new order
  create: protectedProcedure
    .input(
      z.object({
        orderNumber: z.string(),
        boutiqueId: z.number(),
        productId: z.number().optional(),
        quantity: z.number().min(1),
        size: z.string().optional(),
        color: z.string().optional(),
        amount: z.number().min(0),
        deliveryAddress: z.string().optional(),
        customerPhone: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await createOrder({
          ...input,
          customerId: ctx.user.id,
        });
        return { success: true, result };
      } catch (error) {
        console.error("[Orders] Failed to create order:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create order",
        });
      }
    }),

  // Get orders for current customer
  getMyOrders: protectedProcedure.query(async ({ ctx }) => {
    try {
      const orders = await getOrdersByCustomer(ctx.user.id);
      return orders;
    } catch (error) {
      console.error("[Orders] Failed to get customer orders:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch orders",
      });
    }
  }),

  // Get orders for a boutique (boutique owner only)
  getBoutiqueOrders: protectedProcedure
    .input(z.object({ boutiqueId: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        // TODO: Add boutique ownership check
        const orders = await getOrdersByBoutique(input.boutiqueId);
        return orders;
      } catch (error) {
        console.error("[Orders] Failed to get boutique orders:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch boutique orders",
        });
      }
    }),

  // Get order details
  getById: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input }) => {
      try {
        const order = await getOrderById(input.orderId);
        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found",
          });
        }
        return order;
      } catch (error) {
        console.error("[Orders] Failed to get order:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch order",
        });
      }
    }),

  // Update order status
  updateStatus: protectedProcedure
    .input(
      z.object({
        orderId: z.number(),
        status: z.enum(["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await updateOrderStatus(input.orderId, input.status);
        return { success: true, result };
      } catch (error) {
        console.error("[Orders] Failed to update order status:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update order status",
        });
      }
    }),

  // Create checkout session for product order
  createCheckout: protectedProcedure
    .input(
      z.object({
        boutiqueId: z.number(),
        productId: z.number().optional(),
        productName: z.string(),
        quantity: z.number().min(1),
        size: z.string().optional(),
        color: z.string().optional(),
        amount: z.number().min(0), // in ZAR
        deliveryAddress: z.string(),
        customerPhone: z.string(),
        successUrl: z.string().url(),
        cancelUrl: z.string().url(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const { createOrderPaymentIntent } = await import("../yoko-payment");

        // Generate order number
        const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Create payment intent with Yoko
        const paymentIntent = await createOrderPaymentIntent({
          userId: ctx.user.id,
          userEmail: ctx.user.email || "",
          userName: ctx.user.name || "Customer",
          amount: Math.round(input.amount * 100), // Convert to cents
          orderNumber,
          productName: input.productName,
          quantity: input.quantity,
          successUrl: input.successUrl,
          cancelUrl: input.cancelUrl,
        });

        // Store order in database with pending status
        const order = await createOrder({
          orderNumber,
          boutiqueId: input.boutiqueId,
          productId: input.productId,
          quantity: input.quantity,
          size: input.size,
          color: input.color,
          amount: input.amount,
          deliveryAddress: input.deliveryAddress,
          customerPhone: input.customerPhone,
          notes: `Payment Intent ID: ${paymentIntent.id}`,
        });

        return {
          success: true,
          orderNumber,
          checkoutUrl: paymentIntent.checkoutUrl,
          paymentIntentId: paymentIntent.id,
        };
      } catch (error) {
        console.error("[Orders] Failed to create checkout:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create checkout session",
        });
      }
    }),
});
