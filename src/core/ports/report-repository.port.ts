export interface SalesSummaryDto {
  todayRevenue: number;
  todayOrdersCount: number;
  monthRevenue: number;
  monthOrdersCount: number;
  totalProductsCount: number;
  lowStockProductsCount: number;
  recentOrders: {
    id: string;
    orderNumber: string;
    finalAmount: number;
    paymentMethod: string;
    createdAt: Date;
    itemCount: number;
  }[];
  topSellingProducts: {
    productId: string;
    productName: string;
    sku: string;
    totalQuantitySold: number;
    totalRevenue: number;
  }[];
  dailyRevenueChart: {
    date: string;
    revenue: number;
    orderCount: number;
  }[];
}

export interface IReportRepository {
  getSummary(): Promise<SalesSummaryDto>;
}

