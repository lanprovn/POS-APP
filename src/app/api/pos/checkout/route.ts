import { NextRequest } from "next/server";
import { PrismaOrderRepository } from "@/adapters/repositories/prisma-order.repository";
import { PrismaProductRepository } from "@/adapters/repositories/prisma-product.repository";
import { CreateOrderUseCase } from "@/core/use-cases/create-order.use-case";
import { jsonSuccess, jsonError } from "@/adapters/presenters/api-response";
import { z } from "zod";

const orderRepo = new PrismaOrderRepository();
const productRepo = new PrismaProductRepository();
const createOrderUseCase = new CreateOrderUseCase(orderRepo, productRepo);

const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Thiếu ID sản phẩm"),
        quantity: z.number().int().min(1, "Số lượng tối thiểu là 1"),
        unitPrice: z.number().optional(),
      })
    )
    .min(1, "Giỏ hàng phải có ít nhất 1 sản phẩm"),
  discountAmount: z.number().min(0).default(0),
  taxAmount: z.number().min(0).default(0),
  customerPayment: z.number().min(0).default(0),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CARD"]),
  cashierName: z.string().default("Thu ngân 01"),
  notes: z.string().optional(),
  customerId: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = checkoutSchema.parse(body);

    const order = await createOrderUseCase.execute({
      items: validated.items,
      discountAmount: validated.discountAmount,
      taxAmount: validated.taxAmount,
      customerPayment: validated.customerPayment,
      paymentMethod: validated.paymentMethod,
      cashierName: validated.cashierName,
      notes: validated.notes,
      customerId: validated.customerId || undefined,
    });

    return jsonSuccess(order, 201);
  } catch (error) {
    return jsonError(error);
  }
}

