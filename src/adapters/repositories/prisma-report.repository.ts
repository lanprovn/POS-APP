import { prisma } from "@/infrastructure/db/prisma";
import { IReportRepository, SalesSummaryDto } from "@/core/ports/report-repository.port";

export class PrismaReportRepository implements IReportRepository {
  async getSummary(): Promise<SalesSummaryDto> {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Đơn hàng hôm nay & trong tháng
    const [todayOrders, monthOrders, totalProducts, lowStockProducts, recentOrdersRaw] = await Promise.all([
      prisma.order.findMany({
        where: {
          createdAt: { gte: startOfToday },
          paymentStatus: "PAID",
        },
        select: { finalAmount: true },
      }),
      prisma.order.findMany({
        where: {
          createdAt: { gte: startOfMonth },
          paymentStatus: "PAID",
        },
        select: { finalAmount: true },
      }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.count({
        where: {
          isActive: true,
          stockQuantity: { lte: 5 },
        },
      }),
      prisma.order.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: {
          items: {
            select: { id: true },
          },
        },
      }),
    ]);

    const todayRevenue = todayOrders.reduce((acc, o) => acc + o.finalAmount, 0);
    const monthRevenue = monthOrders.reduce((acc, o) => acc + o.finalAmount, 0);

    // 2. Top sản phẩm bán chạy nhất
    const orderItemsGrouped = await prisma.orderItem.groupBy({
      by: ["productId", "productName", "sku"],
      _sum: {
        quantity: true,
        subtotal: true,
      },
      orderBy: {
        _sum: {
          quantity: "desc",
        },
      },
      take: 5,
    });

    const topSellingProducts = orderItemsGrouped.map((item) => ({
      productId: item.productId || "",
      productName: item.productName,
      sku: item.sku,
      totalQuantitySold: item._sum.quantity || 0,
      totalRevenue: item._sum.subtotal || 0,
    }));

    // 3. Doanh thu 7 ngày gần nhất
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const pastOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        paymentStatus: "PAID",
      },
      select: {
        finalAmount: true,
        createdAt: true,
      },
    });

    const dailyMap = new Map<string, { revenue: number; orderCount: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
      dailyMap.set(dateStr, { revenue: 0, orderCount: 0 });
    }

    for (const ord of pastOrders) {
      const dStr = ord.createdAt.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
      if (dailyMap.has(dStr)) {
        const cur = dailyMap.get(dStr)!;
        cur.revenue += ord.finalAmount;
        cur.orderCount += 1;
      }
    }

    const dailyRevenueChart = Array.from(dailyMap.entries()).map(([date, val]) => ({
      date,
      revenue: val.revenue,
      orderCount: val.orderCount,
    }));

    return {
      todayRevenue,
      todayOrdersCount: todayOrders.length,
      monthRevenue,
      monthOrdersCount: monthOrders.length,
      totalProductsCount: totalProducts,
      lowStockProductsCount: lowStockProducts,
      recentOrders: recentOrdersRaw.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        finalAmount: o.finalAmount,
        paymentMethod: o.paymentMethod,
        createdAt: o.createdAt,
        itemCount: o.items.length,
      })),
      topSellingProducts,
      dailyRevenueChart,
    };
  }
}

