import { NextRequest } from "next/server";
import { PrismaShiftRepository } from "@/adapters/repositories/prisma-shift.repository";
import { AddCashTransactionUseCase } from "@/core/use-cases/shift.use-cases";
import { jsonSuccess, jsonError } from "@/adapters/presenters/api-response";
import { z } from "zod";

const shiftRepo = new PrismaShiftRepository();
const addCashTransactionUseCase = new AddCashTransactionUseCase(shiftRepo);

const cashTransactionSchema = z.object({
  shiftId: z.string().min(1, "Thiếu mã ca làm việc"),
  type: z.enum(["PAYOUT", "DROP", "IN"]),
  amount: z.number().positive("Số tiền phải lớn hơn 0"),
  reason: z.string().min(1, "Vui lòng nhập lý do giao dịch tiền"),
  performedBy: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = cashTransactionSchema.parse(body);

    const transaction = await addCashTransactionUseCase.execute({
      shiftId: validated.shiftId,
      type: validated.type,
      amount: validated.amount,
      reason: validated.reason,
      performedBy: validated.performedBy,
    });

    return jsonSuccess(transaction, 201);
  } catch (error) {
    return jsonError(error);
  }
}

