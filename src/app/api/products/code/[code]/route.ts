import { NextRequest } from "next/server";
import { PrismaProductRepository } from "@/adapters/repositories/prisma-product.repository";
import { GetProductByCodeUseCase } from "@/core/use-cases/product.use-cases";
import { jsonSuccess, jsonError } from "@/adapters/presenters/api-response";
import { NotFoundError } from "@/core/errors/app-error";

const productRepo = new PrismaProductRepository();
const getByCodeUseCase = new GetProductByCodeUseCase(productRepo);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const decodedCode = decodeURIComponent(code);
    const product = await getByCodeUseCase.execute(decodedCode);

    if (!product) {
      throw new NotFoundError(`Không tìm thấy sản phẩm có mã Barcode/SKU: "${decodedCode}"`);
    }

    return jsonSuccess(product);
  } catch (error) {
    return jsonError(error);
  }
}

