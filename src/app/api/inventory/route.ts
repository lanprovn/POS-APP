import { NextRequest } from "next/server";
import { PrismaInventoryRepository } from "@/adapters/repositories/prisma-inventory.repository";
import { jsonSuccess, jsonError } from "@/adapters/presenters/api-response";
import { z } from "zod";

const inventoryRepo = new PrismaInventoryRepository();

const adjustStockSchema = z.object({
  productId: z.string().min(1, "Thiếu ID sản phẩm"),
  newStock: z.number().int().min(0, "Số lượng tồn kho không được âm"),
  note: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId") || undefined;
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    const history = await inventoryRepo.getHistory(productId, limit);
    return jsonSuccess(history);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = adjustStockSchema.parse(body);

    const result = await inventoryRepo.adjustStock(
      validated.productId,
      validated.newStock,
      validated.note
    );

    return jsonSuccess(result);
  } catch (error) {
    return jsonError(error);
  }
}

