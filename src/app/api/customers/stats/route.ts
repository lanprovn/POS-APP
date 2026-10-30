import { NextRequest } from "next/server";
import { PrismaCustomerRepository } from "@/adapters/repositories/prisma-customer.repository";
import { GetCustomerStatsUseCase } from "@/core/use-cases/customer.use-cases";
import { jsonSuccess, jsonError } from "@/adapters/presenters/api-response";

const customerRepo = new PrismaCustomerRepository();
const getCustomerStatsUseCase = new GetCustomerStatsUseCase(customerRepo);

export async function GET(req: NextRequest) {
  try {
    const stats = await getCustomerStatsUseCase.execute();
    return jsonSuccess(stats);
  } catch (error) {
    return jsonError(error);
  }
}

