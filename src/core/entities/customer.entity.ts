export type CustomerTier = "BRONZE" | "SILVER" | "GOLD" | "DIAMOND";

export interface CustomerTierInfo {
  tier: CustomerTier;
  label: string;
  minSpent: number;
  color: string;
  badgeClass: string;
}

export const CUSTOMER_TIERS: Record<CustomerTier, CustomerTierInfo> = {
  BRONZE: {
    tier: "BRONZE",
    label: "Hạng Đồng",
    minSpent: 0,
    color: "#cd7f32",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
  },
  SILVER: {
    tier: "SILVER",
    label: "Hạng Bạc",
    minSpent: 3000000,
    color: "#94a3b8",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
  },
  GOLD: {
    tier: "GOLD",
    label: "Hạng Vàng",
    minSpent: 10000000,
    color: "#eab308",
    badgeClass: "bg-yellow-100 text-yellow-800 border-yellow-300",
  },
  DIAMOND: {
    tier: "DIAMOND",
    label: "Hạng Kim Cương",
    minSpent: 25000000,
    color: "#06b6d4",
    badgeClass: "bg-cyan-100 text-cyan-800 border-cyan-300",
  },
};

export interface CustomerEntity {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  totalSpent: number;
  points: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerWithOrdersEntity extends CustomerEntity {
  ordersCount: number;
  lastOrderDate?: Date | null;
}

/**
 * Xác định phân hạng khách hàng dựa trên tổng chi tiêu
 */
export function getCustomerTier(totalSpent: number): CustomerTierInfo {
  if (totalSpent >= CUSTOMER_TIERS.DIAMOND.minSpent) {
    return CUSTOMER_TIERS.DIAMOND;
  }
  if (totalSpent >= CUSTOMER_TIERS.GOLD.minSpent) {
    return CUSTOMER_TIERS.GOLD;
  }
  if (totalSpent >= CUSTOMER_TIERS.SILVER.minSpent) {
    return CUSTOMER_TIERS.SILVER;
  }
  return CUSTOMER_TIERS.BRONZE;
}

/**
 * Tỷ lệ quy đổi điểm:
 * 10,000 VND = 1 điểm tích lũy
 */
export function calculateEarnedPoints(finalAmount: number): number {
  if (finalAmount <= 0) return 0;
  return Math.floor(finalAmount / 10000);
}

/**
 * 1 điểm = 1,000 VND khi thanh toán
 */
export function calculatePointValue(points: number): number {
  if (points <= 0) return 0;
  return points * 1000;
}
