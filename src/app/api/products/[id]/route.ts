import { NextRequest } from "next/server";
import { PrismaProductRepository } from "@/adapters/repositories/prisma-product.repository";
import { UpdateProductUseCase, DeleteProductUseCase } from "@/core/use-cases/product.use-cases";
import { jsonSuccess, jsonError } from "@/adapters/presenters/api-response";
import { z } from "zod";

const productRepo = new PrismaProductRepository();
const updateUseCase = new UpdateProductUseCase(productRepo);
const deleteUseCase = new DeleteProductUseCase(productRepo);

const updateProductSchema = z.object({
  sku: z.string().optional(),
  barcode: z.string().optional().nullable(),
  name: z.string().optional(),
  description: z.string().optional().nullable(),
  costPrice: z.number().min(0).optional(),
  sellingPrice: z.number().min(0).optional(),
  stockQuantity: z.number().int().min(0).optional(),
  minStockThreshold: z.number().int().min(0).optional(),
  unit: z.string().optional(),
  categoryId: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await productRepo.findById(id);
    if (!product) {
      return jsonError(new Error("Không tìm thấy sản phẩm"));
    }
    return jsonSuccess(product);
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validated = updateProductSchema.parse(body);
    const updated = await updateUseCase.execute(id, validated);
    return jsonSuccess(updated);
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteUseCase.execute(id);
    return jsonSuccess({ message: "Đã xóa sản phẩm thành công" });
  } catch (error) {
    return jsonError(error);
  }
}

