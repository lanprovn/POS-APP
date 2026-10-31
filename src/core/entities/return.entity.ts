export type RefundMethod = "CASH" | "BANK_TRANSFER";

export type ReturnReason =
  | "DEFECTIVE"             // Hàng lỗi / Hỏng hóc
  | "CUSTOMER_CHANGED_MIND" // Khách đổi ý / Không vừa ý
  | "WRONG_ITEM"            // Giao sai sản phẩm / Nhầm mẫu
  | "EXPIRED"               // Cận date / Hết hạn sử dụng
  | "OTHER";                // Lý do khác

export const RETURN_REASON_LABELS: Record<string, string> = {
  DEFECTIVE: "Hàng lỗi / Hỏng hóc",
  CUSTOMER_CHANGED_MIND: "Khách đổi ý / Không vừa ý",
  WRONG_ITEM: "Giao sai sản phẩm / Nhầm mẫu",
  EXPIRED: "Cận date / Hết hạn sử dụng",
  OTHER: "Lý do khác",
};

export interface ReturnItemEntity {
  id?: string;
  returnId?: string;
  orderItemId?: string | null;
  productId?: string | null;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  refundAmount: number;
  restockToInventory: boolean;
}

export interface ReturnReceiptEntity {
  id: string;
  returnNumber: string;
  orderId: string;
  orderNumber?: string;
  customerId?: string | null;
  customer?: { id: string; name: string; phone?: string | null } | null;
  shiftId?: string | null;
  totalRefundAmount: number;
  refundMethod: RefundMethod;
  reason?: string | null;
  cashierName: string;
  notes?: string | null;
  items: ReturnItemEntity[];
  createdAt: Date;
  updatedAt: Date;
}
