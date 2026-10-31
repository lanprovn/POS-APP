import { NextRequest } from "next/server";
import { PrismaReturnRepository } from "@/adapters/repositories/prisma-return.repository";
import { GetOrderReturnEligibilityUseCase } from "@/core/use-cases/return.use-cases";
import { jsonSuccess, jsonError } from "@/adapters/presenters/api-response";

const returnRepo = new PrismaReturnRepository();
const getOrderReturnEligibilityUseCase = new GetOrderReturnEligibilityUseCase(returnRepo);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await getOrderReturnEligibilityUseCase.execute(id);
    return jsonSuccess(result);
  } catch (error) {
    return jsonError(error);
  }
}
