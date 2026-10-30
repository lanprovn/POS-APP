import { NextRequest } from "next/server";
import { PrismaProductRepository } from "@/adapters/repositories/prisma-product.repository";
import { jsonSuccess, jsonError } from "@/adapters/presenters/api-response";
import { z } from "zod";

const productRepo = new PrismaProductRepository();

const createCategorySchema = z.object({
  name: z.string().min(1, "Tên danh mục không được để trống"),
  slug: z.string().min(1, "Slug không được để trống"),
  description: z.string().optional().nullable(),
});

export async function GET() {
  try {
    const categories = await productRepo.listCategories();
    return jsonSuccess(categories);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = createCategorySchema.parse(body);
    const category = await productRepo.createCategory(validated);
    return jsonSuccess(category, 201);
  } catch (error) {
    return jsonError(error);
  }
}

