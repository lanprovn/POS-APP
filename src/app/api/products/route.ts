import { NextRequest } from "next/server";
import { PrismaProductRepository } from "@/adapters/repositories/prisma-product.repository";
import { ListProductsUseCase, CreateProductUseCase } from "@/core/use-cases/product.use-cases";
import { jsonSuccess, jsonError } from "@/adapters/presenters/api-response";
import { z } from "zod";

const productRepo = new PrismaProductRepository();
const listUseCase = new ListProductsUseCase(productRepo);
const createUseCase = new CreateProductUseCase(productRepo);

const createProductSchema = z.object({
  sku: z.string().min(1, "Mã SKU không được để trống"),
  barcode: z.string().optional().nullable(),
  name: z.string().min(1, "Tên sản phẩm không được để trống"),
  description: z.string().optional().nullable(),
  costPrice: z.number().min(0, "Giá vốn không được âm"),
  sellingPrice: z.number().min(0, "Giá bán không được âm"),
  stockQuantity: z.number().int().min(0, "Số lượng tồn kho không được âm").default(0),
  minStockThreshold: z.number().int().min(0).default(5),
  unit: z.string().default("Cái"),
  categoryId: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const categoryId = searchParams.get("categoryId") || undefined;
    const isLowStockOnly = searchParams.get("lowStock") === "true";

    const result = await listUseCase.execute({
      search,
      categoryId,
      isLowStockOnly,
    });

    return jsonSuccess(result);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = createProductSchema.parse(body);
    const product = await createUseCase.execute(validated);
    return jsonSuccess(product, 201);
  } catch (error) {
    return jsonError(error);
  }
}

