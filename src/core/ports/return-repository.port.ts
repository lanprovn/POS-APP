import { ReturnReceiptEntity, ReturnItemEntity, RefundMethod } from "../entities/return.entity";

export interface CreateReturnInput {
  orderId: string;
  refundMethod: RefundMethod;
  reason?: string;
  notes?: string;
  cashierName: string;
  shiftId?: string | null;
  items: {
    orderItemId?: string;
    productId?: string | null;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    refundAmount: number;
    restockToInventory: boolean;
  }[];
}

export interface FindReturnsFilter {
  returnNumber?: string;
  orderNumber?: string;
  customerPhone?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface OrderItemReturnEligibility {
  orderItemId: string;
  productId?: string | null;
  productName: string;
  sku: string;
  unitPrice: number;
  originalQuantity: number;
  alreadyReturnedQuantity: number;
  remainingQuantity: number;
}

export interface OrderReturnEligibility {
  orderId: string;
  orderNumber: string;
  createdAt: Date;
  customer?: { id: string; name: string; phone?: string | null } | null;
  paymentMethod: string;
  finalAmount: number;
  orderStatus: string;
  items: OrderItemReturnEligibility[];
}

export interface IReturnRepository {
  createReturn(input: CreateReturnInput): Promise<ReturnReceiptEntity>;
  findById(id: string): Promise<ReturnReceiptEntity | null>;
  findByReturnNumber(returnNumber: string): Promise<ReturnReceiptEntity | null>;
  findMany(filter?: FindReturnsFilter): Promise<{ returns: ReturnReceiptEntity[]; total: number }>;
  checkOrderReturnEligibility(orderIdOrNumber: string): Promise<OrderReturnEligibility | null>;
}
