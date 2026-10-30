import { prisma } from "@/infrastructure/db/prisma";
import { IOrderRepository, FindOrdersFilter } from "@/core/ports/order-repository.port";
import { OrderEntity, OrderItemEntity, PaymentMethod, PaymentStatus, OrderStatus } from "@/core/entities/order.entity";

export class PrismaOrderRepository implements IOrderRepository {
  async createWithTransaction(
    orderData: {
      orderNumber: string;
      subtotalAmount: number;
      discountAmount: number;
      taxAmount: number;
      finalAmount: number;
      customerPayment: number;
      changeAmount: number;
      paymentMethod: PaymentMethod;
      cashierName: string;
      notes?: string | null;
      customerId?: string | null;
    },
    items: OrderItemEntity[]
  ): Promise<OrderEntity> {
    return await prisma.$transaction(async (tx) => {
      // 1. Tạo đơn hàng và chi tiết
      const createdOrder = await tx.order.create({
        data: {
          orderNumber: orderData.orderNumber,
          subtotalAmount: orderData.subtotalAmount,
          discountAmount: orderData.discountAmount,
          taxAmount: orderData.taxAmount,
          finalAmount: orderData.finalAmount,
          customerPayment: orderData.customerPayment,
          changeAmount: orderData.changeAmount,
          paymentMethod: orderData.paymentMethod,
          paymentStatus: "PAID",
          orderStatus: "COMPLETED",
          cashierName: orderData.cashierName,
          notes: orderData.notes,
          customerId: orderData.customerId,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              sku: item.sku,
              unitPrice: item.unitPrice,
              costPrice: item.costPrice,
              quantity: item.quantity,
              subtotal: item.subtotal,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      // 2. Trừ tồn kho và ghi nhận lịch sử biến động kho
      for (const item of items) {
        if (item.productId) {
          const currentProd = await tx.product.findUnique({
            where: { id: item.productId },
            select: { stockQuantity: true },
          });

          const prevStock = currentProd?.stockQuantity ?? 0;
          const newStock = Math.max(0, prevStock - item.quantity);

          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQuantity: {
                decrement: item.quantity,
              },
            },
          });

          await tx.inventoryTransaction.create({
            data: {
              productId: item.productId,
              type: "SALE",
              quantityChange: -item.quantity,
              previousStock: prevStock,
              newStock,
              referenceId: createdOrder.id,
              note: `Bán lẻ qua đơn hàng #${createdOrder.orderNumber}`,
            },
          });
        }
      }

      // 3. Cập nhật tích điểm cho khách hàng nếu có
      if (orderData.customerId) {
        await tx.customer.update({
          where: { id: orderData.customerId },
          data: {
            totalSpent: { increment: orderData.finalAmount },
            points: { increment: Math.floor(orderData.finalAmount / 10000) }, // 10k VND = 1 điểm
          },
        });
      }

      return {
        ...createdOrder,
        paymentMethod: createdOrder.paymentMethod as PaymentMethod,
        paymentStatus: createdOrder.paymentStatus as PaymentStatus,
        orderStatus: createdOrder.orderStatus as OrderStatus,
        items: createdOrder.items,
      };
    });
  }

  async findById(id: string): Promise<OrderEntity | null> {
    const o = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!o) return null;
    return {
      ...o,
      paymentMethod: o.paymentMethod as PaymentMethod,
      paymentStatus: o.paymentStatus as PaymentStatus,
      orderStatus: o.orderStatus as OrderStatus,
    };
  }

  async findByOrderNumber(orderNumber: string): Promise<OrderEntity | null> {
    const o = await prisma.order.findUnique({
      where: { orderNumber },
      include: { items: true },
    });
    if (!o) return null;
    return {
      ...o,
      paymentMethod: o.paymentMethod as PaymentMethod,
      paymentStatus: o.paymentStatus as PaymentStatus,
      orderStatus: o.orderStatus as OrderStatus,
    };
  }

  async findMany(filter?: FindOrdersFilter): Promise<{ orders: OrderEntity[]; total: number }> {
    const where: any = {};

    if (filter?.orderNumber) {
      where.orderNumber = { contains: filter.orderNumber.trim() };
    }

    if (filter?.paymentStatus) {
      where.paymentStatus = filter.paymentStatus;
    }

    if (filter?.startDate || filter?.endDate) {
      where.createdAt = {};
      if (filter.startDate) where.createdAt.gte = filter.startDate;
      if (filter.endDate) where.createdAt.lte = filter.endDate;
    }

    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: "desc" },
        take: filter?.limit || 50,
        skip: filter?.page && filter?.limit ? (filter.page - 1) * filter.limit : 0,
      }),
      prisma.order.count({ where }),
    ]);

    const orders: OrderEntity[] = items.map((o) => ({
      ...o,
      paymentMethod: o.paymentMethod as PaymentMethod,
      paymentStatus: o.paymentStatus as PaymentStatus,
      orderStatus: o.orderStatus as OrderStatus,
    }));

    return { orders, total };
  }
}

