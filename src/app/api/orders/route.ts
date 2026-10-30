import { NextRequest } from "next/server";
import { PrismaOrderRepository } from "@/adapters/repositories/prisma-order.repository";
import { jsonSuccess, jsonError } from "@/adapters/presenters/api-response";

const orderRepo = new PrismaOrderRepository();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderNumber = searchParams.get("orderNumber") || undefined;
    const paymentStatus = searchParams.get("paymentStatus") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const result = await orderRepo.findMany({
      orderNumber,
      paymentStatus,
      page,
      limit,
    });

    return jsonSuccess(result);
  } catch (error) {
    return jsonError(error);
  }
}

