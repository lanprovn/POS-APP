import { NextRequest } from "next/server";
import { PrismaOrderRepository } from "@/adapters/repositories/prisma-order.repository";
import { jsonSuccess, jsonError } from "@/adapters/presenters/api-response";
import { NotFoundError } from "@/core/errors/app-error";

const orderRepo = new PrismaOrderRepository();

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await orderRepo.findById(id);
    if (!order) {
      throw new NotFoundError(`Không tìm thấy đơn hàng với ID: ${id}`);
    }
    return jsonSuccess(order);
  } catch (error) {
    return jsonError(error);
  }
}

