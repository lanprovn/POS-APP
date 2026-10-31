import { prisma } from "@/infrastructure/db/prisma";
import {
  IReturnRepository,
  CreateReturnInput,
  FindReturnsFilter,
  OrderReturnEligibility,
  OrderItemReturnEligibility,
} from "@/core/ports/return-repository.port";
import { ReturnReceiptEntity, RefundMethod } from "@/core/entities/return.entity";
import { NotFoundError, ValidationError, BusinessRuleError } from "@/core/errors/app-error";

export class PrismaReturnRepository implements IReturnRepository {
  async checkOrderReturnEligibility(orderIdOrNumber: string): Promise<OrderReturnEligibility | null> {
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { id: orderIdOrNumber },
          { orderNumber: orderIdOrNumber },
        ],
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        items: true,
        returnReceipts: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!order) return null;

    // Calculate how many units of each item have already been returned
    const returnedMap: Record<string, number> = {};
    for (const receipt of order.returnReceipts) {
      for (const retItem of receipt.items) {
        const key = retItem.orderItemId || retItem.sku;
        returnedMap[key] = (returnedMap[key] || 0) + retItem.quantity;
      }
    }

    const items: OrderItemReturnEligibility[] = order.items.map((item) => {
      const key = item.id || item.sku;
      const alreadyReturned = returnedMap[key] || returnedMap[item.sku] || 0;
      const remaining = Math.max(0, item.quantity - alreadyReturned);

      return {
        orderItemId: item.id,
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        unitPrice: item.unitPrice,
        originalQuantity: item.quantity,
        alreadyReturnedQuantity: alreadyReturned,
        remainingQuantity: remaining,
      };
    });

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      customer: order.customer,
      paymentMethod: order.paymentMethod,
      finalAmount: order.finalAmount,
      orderStatus: order.orderStatus,
      items,
    };
  }

  async createReturn(input: CreateReturnInput): Promise<ReturnReceiptEntity> {
    return await prisma.$transaction(async (tx) => {
      // 1. Fetch order
      const order = await tx.order.findUnique({
        where: { id: input.orderId },
        include: {
          items: true,
          returnReceipts: {
            include: { items: true },
          },
          customer: true,
        },
      });

      if (!order) {
        throw new NotFoundError("Đơn hàng không tồn tại");
      }

      if (order.orderStatus === "CANCELLED") {
        throw new BusinessRuleError("Không thể trả hàng cho đơn đã bị hủy");
      }

      // Check current returned quantities
      const returnedMap: Record<string, number> = {};
      for (const receipt of order.returnReceipts) {
        for (const retItem of receipt.items) {
          const key = retItem.orderItemId || retItem.sku;
          returnedMap[key] = (returnedMap[key] || 0) + retItem.quantity;
        }
      }

      // Validate quantities requested
      let calculatedTotalRefund = 0;
      for (const item of input.items) {
        const originalItem = order.items.find(
          (oi) => oi.id === item.orderItemId || oi.sku === item.sku
        );
        if (!originalItem) {
          throw new ValidationError(`Mặt hàng ${item.productName} không thuộc đơn hàng này`);
        }

        const key = originalItem.id || originalItem.sku;
        const alreadyReturned = returnedMap[key] || returnedMap[originalItem.sku] || 0;
        const remaining = originalItem.quantity - alreadyReturned;

        if (item.quantity > remaining) {
          throw new BusinessRuleError(
            `Số lượng trả lại của '${item.productName}' (${item.quantity}) vượt quá số lượng còn lại có thể trả (${remaining})`
          );
        }

        calculatedTotalRefund += item.quantity * item.unitPrice;
      }

      // 2. Generate unique returnNumber
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      const datePrefix = `TH-${yyyy}${mm}${dd}-`;

      const todayReturnsCount = await tx.returnReceipt.count({
        where: {
          returnNumber: {
            startsWith: datePrefix,
          },
        },
      });

      const sequence = String(todayReturnsCount + 1).padStart(4, "0");
      const returnNumber = `${datePrefix}${sequence}`;

      // 3. Create ReturnReceipt
      const createdReturn = await tx.returnReceipt.create({
        data: {
          returnNumber,
          orderId: order.id,
          customerId: order.customerId,
          shiftId: input.shiftId || order.shiftId || null,
          totalRefundAmount: calculatedTotalRefund,
          refundMethod: input.refundMethod,
          reason: input.reason || "Lý do khác",
          cashierName: input.cashierName || "Thu ngân",
          notes: input.notes,
          items: {
            create: input.items.map((i) => ({
              orderItemId: i.orderItemId,
              productId: i.productId,
              productName: i.productName,
              sku: i.sku,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              refundAmount: i.quantity * i.unitPrice,
              restockToInventory: i.restockToInventory,
            })),
          },
        },
        include: {
          items: true,
          order: { select: { orderNumber: true } },
          customer: { select: { id: true, name: true, phone: true } },
        },
      });

      // 4. Restock inventory if needed
      for (const item of input.items) {
        if (item.restockToInventory && item.productId) {
          const currentProd = await tx.product.findUnique({
            where: { id: item.productId },
            select: { stockQuantity: true },
          });

          const prevStock = currentProd?.stockQuantity ?? 0;
          const newStock = prevStock + item.quantity;

          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: { increment: item.quantity },
            },
          });

          await tx.inventoryTransaction.create({
            data: {
              productId: item.productId,
              type: "RETURN",
              quantityChange: item.quantity,
              previousStock: prevStock,
              newStock,
              referenceId: createdReturn.id,
              note: `Nhập lại kho từ phiếu trả hàng #${returnNumber}`,
            },
          });
        }
      }

      // 5. Update Cash Shift if cash refund
      if (input.refundMethod === "CASH" && (input.shiftId || order.shiftId)) {
        const activeShiftId = input.shiftId || order.shiftId;
        if (activeShiftId) {
          await tx.cashShift.update({
            where: { id: activeShiftId },
            data: {
              expectedCash: { decrement: calculatedTotalRefund },
              cashPayout: { increment: calculatedTotalRefund },
            },
          });

          await tx.cashTransaction.create({
            data: {
              shiftId: activeShiftId,
              type: "PAYOUT",
              amount: calculatedTotalRefund,
              reason: `Hoàn tiền khách trả hàng #${returnNumber}`,
              performedBy: input.cashierName || "Thu ngân",
            },
          });
        }
      }

      // 6. Adjust Customer loyalty points & total spent if registered customer
      if (order.customerId) {
        const pointsToRevoke = Math.floor(calculatedTotalRefund / 10000);
        await tx.customer.update({
          where: { id: order.customerId },
          data: {
            totalSpent: { decrement: calculatedTotalRefund },
            points: { decrement: pointsToRevoke },
          },
        });
      }

      // 7. Check if order is fully returned or partially returned
      // Recalculate remaining quantities for all items in order
      for (const item of input.items) {
        const key = item.orderItemId || item.sku;
        returnedMap[key] = (returnedMap[key] || 0) + item.quantity;
      }

      const isAllReturned = order.items.every((oi) => {
        const key = oi.id || oi.sku;
        const totalRet = returnedMap[key] || returnedMap[oi.sku] || 0;
        return totalRet >= oi.quantity;
      });

      await tx.order.update({
        where: { id: order.id },
        data: {
          orderStatus: isAllReturned ? "REFUNDED" : "PARTIALLY_REFUNDED",
          paymentStatus: isAllReturned ? "REFUNDED" : "PAID",
        },
      });

      return {
        ...createdReturn,
        orderNumber: createdReturn.order.orderNumber,
        refundMethod: createdReturn.refundMethod as RefundMethod,
        items: createdReturn.items,
      };
    });
  }

  async findById(id: string): Promise<ReturnReceiptEntity | null> {
    const r = await prisma.returnReceipt.findUnique({
      where: { id },
      include: {
        order: { select: { orderNumber: true } },
        customer: { select: { id: true, name: true, phone: true } },
        items: true,
      },
    });

    if (!r) return null;
    return {
      ...r,
      orderNumber: r.order.orderNumber,
      refundMethod: r.refundMethod as RefundMethod,
      items: r.items,
    };
  }

  async findByReturnNumber(returnNumber: string): Promise<ReturnReceiptEntity | null> {
    const r = await prisma.returnReceipt.findUnique({
      where: { returnNumber },
      include: {
        order: { select: { orderNumber: true } },
        customer: { select: { id: true, name: true, phone: true } },
        items: true,
      },
    });

    if (!r) return null;
    return {
      ...r,
      orderNumber: r.order.orderNumber,
      refundMethod: r.refundMethod as RefundMethod,
      items: r.items,
    };
  }

  async findMany(filter?: FindReturnsFilter): Promise<{ returns: ReturnReceiptEntity[]; total: number }> {
    const where: any = {};

    if (filter?.returnNumber) {
      where.returnNumber = { contains: filter.returnNumber.trim() };
    }

    if (filter?.orderNumber) {
      where.order = { orderNumber: { contains: filter.orderNumber.trim() } };
    }

    if (filter?.customerPhone) {
      where.customer = { phone: { contains: filter.customerPhone.trim() } };
    }

    if (filter?.startDate || filter?.endDate) {
      where.createdAt = {};
      if (filter.startDate) where.createdAt.gte = filter.startDate;
      if (filter.endDate) where.createdAt.lte = filter.endDate;
    }

    const [items, total] = await Promise.all([
      prisma.returnReceipt.findMany({
        where,
        include: {
          order: { select: { orderNumber: true } },
          customer: { select: { id: true, name: true, phone: true } },
          items: true,
        },
        orderBy: { createdAt: "desc" },
        take: filter?.limit || 50,
        skip: filter?.page && filter?.limit ? (filter.page - 1) * filter.limit : 0,
      }),
      prisma.returnReceipt.count({ where }),
    ]);

    const returns: ReturnReceiptEntity[] = items.map((r) => ({
      ...r,
      orderNumber: r.order.orderNumber,
      refundMethod: r.refundMethod as RefundMethod,
      items: r.items,
    }));

    return { returns, total };
  }
}
