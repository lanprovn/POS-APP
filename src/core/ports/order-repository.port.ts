import { OrderEntity, OrderItemEntity, PaymentMethod } from "../entities/order.entity";

export interface CreateOrderInput {
  items: {
    productId: string;
    quantity: number;
    unitPrice?: number;
  }[];
  discountAmount?: number;
  taxAmount?: number;
  customerPayment?: number;
  paymentMethod: PaymentMethod;
  cashierName?: string;
  notes?: string;
  customerId?: string;
  pointsUsed?: number;
  shiftId?: string | null;
}

export interface FindOrdersFilter {
  startDate?: Date;
  endDate?: Date;
  orderNumber?: string;
  paymentStatus?: string;
  page?: number;
  limit?: number;
}

export interface IOrderRepository {
  createWithTransaction(
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
      pointsUsed?: number;
      shiftId?: string | null;
    },
    items: OrderItemEntity[]
  ): Promise<OrderEntity>;

  findById(id: string): Promise<OrderEntity | null>;
  findByOrderNumber(orderNumber: string): Promise<OrderEntity | null>;
  findMany(filter?: FindOrdersFilter): Promise<{ orders: OrderEntity[]; total: number }>;
}

