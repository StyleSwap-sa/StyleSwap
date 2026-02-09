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
});
