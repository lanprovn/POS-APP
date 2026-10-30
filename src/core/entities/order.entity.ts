export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "CARD";
export type PaymentStatus = "PAID" | "PENDING" | "REFUNDED";
export type OrderStatus = "COMPLETED" | "CANCELLED";

export interface OrderItemEntity {
  id?: string;
  orderId?: string;
  productId?: string | null;
  productName: string;
  sku: string;
  unitPrice: number;
  costPrice: number;
  quantity: number;
  subtotal: number;
}

export interface OrderEntity {
  id: string;
  orderNumber: string;
  subtotalAmount: number;
  discountAmount: number;
  taxAmount: number;
  finalAmount: number;
  customerPayment: number;
  changeAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  cashierName: string;
  notes?: string | null;
  customerId?: string | null;
  shiftId?: string | null;
  customer?: { id: string; name: string; phone?: string | null } | null;
  items: OrderItemEntity[];
  createdAt: Date;
  updatedAt: Date;
}

