import { IOrderRepository } from "../ports/order-repository.port";
import { IProductRepository } from "../ports/product-repository.port";
import { OrderEntity, OrderItemEntity, PaymentMethod } from "../entities/order.entity";
import { ValidationError, NotFoundError, InsufficientStockError } from "../errors/app-error";

export interface CreateOrderUseCaseInput {
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

export class CreateOrderUseCase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly productRepository: IProductRepository
  ) {}

  async execute(input: CreateOrderUseCaseInput): Promise<OrderEntity> {
    if (!input.items || input.items.length === 0) {
      throw new ValidationError("Đơn hàng phải có ít nhất 1 sản phẩm.");
    }

    // Kiểm tra và tổng hợp dữ liệu sản phẩm
    const orderItems: OrderItemEntity[] = [];
    let subtotalAmount = 0;

    for (const item of input.items) {
      if (item.quantity <= 0) {
        throw new ValidationError("Số lượng sản phẩm trong đơn phải lớn hơn 0.");
      }

      const product = await this.productRepository.findById(item.productId);
      if (!product) {
        throw new NotFoundError(`Không tìm thấy sản phẩm có mã ID: ${item.productId}`);
      }

      if (!product.isActive) {
        throw new ValidationError(`Sản phẩm "${product.name}" hiện đang tạm ngừng kinh doanh.`);
      }

      if (product.stockQuantity < item.quantity) {
        throw new InsufficientStockError(product.name, product.stockQuantity, item.quantity);
      }

      const unitPrice = item.unitPrice !== undefined ? item.unitPrice : product.sellingPrice;
      const subtotal = unitPrice * item.quantity;
      subtotalAmount += subtotal;

      orderItems.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        unitPrice,
        costPrice: product.costPrice,
        quantity: item.quantity,
        subtotal,
      });
    }

    const discountAmount = Math.max(0, input.discountAmount || 0);
    const taxAmount = Math.max(0, input.taxAmount || 0);
    const finalAmount = Math.max(0, subtotalAmount - discountAmount + taxAmount);

    let customerPayment = input.customerPayment || 0;
    if (input.paymentMethod === "BANK_TRANSFER" || input.paymentMethod === "CARD") {
      customerPayment = finalAmount;
    }

    if (customerPayment < finalAmount && input.paymentMethod === "CASH") {
      throw new ValidationError(`Tiền khách đưa (${customerPayment.toLocaleString()}đ) nhỏ hơn tổng hóa đơn (${finalAmount.toLocaleString()}đ).`);
    }

    const changeAmount = input.paymentMethod === "CASH" ? Math.max(0, customerPayment - finalAmount) : 0;

    // Sinh mã hóa đơn: HD-YYYYMMDD-XXXX
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `HD-${dateStr}-${randomSuffix}`;

    const orderData = {
      orderNumber,
      subtotalAmount,
      discountAmount,
      taxAmount,
      finalAmount,
      customerPayment,
      changeAmount,
      paymentMethod: input.paymentMethod,
      cashierName: input.cashierName || "Thu ngân",
      notes: input.notes || null,
      customerId: input.customerId || null,
      pointsUsed: input.pointsUsed || 0,
      shiftId: input.shiftId || null,
    };

    return await this.orderRepository.createWithTransaction(orderData, orderItems);
  }
}

