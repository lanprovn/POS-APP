import { NextRequest } from "next/server";
import { PrismaReturnRepository } from "@/adapters/repositories/prisma-return.repository";
import { CreateReturnUseCase, GetReturnsListUseCase } from "@/core/use-cases/return.use-cases";
import { jsonSuccess, jsonError } from "@/adapters/presenters/api-response";

const returnRepo = new PrismaReturnRepository();
const createReturnUseCase = new CreateReturnUseCase(returnRepo);
const getReturnsListUseCase = new GetReturnsListUseCase(returnRepo);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const returnNumber = searchParams.get("returnNumber") || undefined;
    const orderNumber = searchParams.get("orderNumber") || undefined;
    const customerPhone = searchParams.get("customerPhone") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const result = await getReturnsListUseCase.execute({
      returnNumber,
      orderNumber,
      customerPhone,
      page,
      limit,
    });

    return jsonSuccess(result);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await createReturnUseCase.execute(body);
    return jsonSuccess(result, 201);
  } catch (error) {
    return jsonError(error);
  }
}
